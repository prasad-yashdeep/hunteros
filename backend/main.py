"""HunterOS backend — FastAPI server.

Exposes:
  GET  /health
  GET  /agents                 list hunters with derived rank/hp/mp
  GET  /crons                  list quests (cron jobs)
  GET  /sessions               active dungeons
  WS   /stream                 live event firehose
  POST /voice/command          multipart audio -> STT -> intent -> action -> TTS
  POST /command                JSON text command (skip STT)
  POST /tts                    text -> mp3 URL (ElevenLabs)
  GET  /tts/{fname}            serve generated audio

Wraps the `openclaw` CLI plus tails per-agent JSONL event logs.
"""
from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from openclaw_bridge import (
    bus,
    fetch_agents,
    fetch_crons,
    fetch_sessions,
    start_tails,
    run_action,
)
from intents import route_intent
from voice import synth_tts, transcribe

TTS_DIR = Path("/tmp/hunteros-tts")
TTS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="HunterOS", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup() -> None:
    await start_tails()


# ─── REST ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict[str, Any]:
    return {"ok": True, "ts": int(time.time() * 1000), "version": "0.1.0"}


@app.get("/agents")
async def agents() -> list[dict[str, Any]]:
    return await fetch_agents()


@app.get("/crons")
async def crons() -> list[dict[str, Any]]:
    return await fetch_crons()


@app.get("/sessions")
async def sessions(active: int = 1) -> list[dict[str, Any]]:
    return await fetch_sessions(active_only=bool(active))


# ─── Command dispatch ───────────────────────────────────────────────────

class CommandIn(BaseModel):
    text: str
    confirm: bool = False


@app.post("/command")
async def command(cmd: CommandIn) -> dict[str, Any]:
    intent = route_intent(cmd.text)
    if intent.destructive and not cmd.confirm:
        return {
            "transcript": cmd.text,
            "intent": intent.model_dump(),
            "needsConfirmation": True,
            "result": None,
        }
    result = await run_action(intent)
    await bus.publish({
        "type": "command.executed",
        "intent": intent.model_dump(),
        "result": result,
        "ts": int(time.time() * 1000),
    })
    return {
        "transcript": cmd.text,
        "intent": intent.model_dump(),
        "result": result,
        "needsConfirmation": False,
    }


@app.post("/voice/command")
async def voice_command(
    audio: UploadFile = File(...),
    autoSpeak: str = Form("1"),
    confirm: str = Form("0"),
) -> dict[str, Any]:
    blob = await audio.read()
    if not blob:
        raise HTTPException(400, "empty audio")
    ext = ".webm" if "webm" in (audio.content_type or "") else ".m4a"
    tmp = TTS_DIR / f"rec-{uuid.uuid4().hex}{ext}"
    tmp.write_bytes(blob)
    try:
        transcript = await transcribe(str(tmp))
    finally:
        try:
            tmp.unlink()
        except Exception:
            pass
    intent = route_intent(transcript)
    needs_confirm = intent.destructive and confirm != "1"
    result = None if needs_confirm else await run_action(intent)

    tts_url = None
    if autoSpeak == "1":
        speak_text = _speak_line(intent, result, transcript, needs_confirm)
        if speak_text:
            fname = await synth_tts(speak_text, TTS_DIR)
            tts_url = f"/tts/{fname}" if fname else None

    payload = {
        "transcript": transcript,
        "intent": intent.model_dump(),
        "result": result,
        "needsConfirmation": needs_confirm,
        "ttsUrl": tts_url,
        "ts": int(time.time() * 1000),
    }
    await bus.publish({"type": "voice.command", **payload})
    return payload


class TTSIn(BaseModel):
    text: str
    voice: str | None = None


@app.post("/tts")
async def tts(body: TTSIn) -> dict[str, Any]:
    fname = await synth_tts(body.text, TTS_DIR, voice=body.voice)
    if not fname:
        raise HTTPException(500, "tts failed")
    return {"url": f"/tts/{fname}"}


@app.get("/tts/{fname}")
async def tts_file(fname: str) -> FileResponse:
    path = TTS_DIR / fname
    if not path.exists():
        raise HTTPException(404)
    return FileResponse(str(path), media_type="audio/mpeg")


# ─── WebSocket firehose ─────────────────────────────────────────────────

@app.websocket("/stream")
async def stream(ws: WebSocket) -> None:
    await ws.accept()
    queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=256)
    unsub = bus.subscribe(queue)
    try:
        # Send hello + snapshot
        await ws.send_json({"type": "hello", "ts": int(time.time() * 1000)})
        snap = {
            "type": "snapshot",
            "agents": await fetch_agents(),
            "crons": await fetch_crons(),
            "sessions": await fetch_sessions(active_only=True),
            "ts": int(time.time() * 1000),
        }
        await ws.send_json(snap)

        async def _recv():
            while True:
                try:
                    msg = await ws.receive_text()
                except WebSocketDisconnect:
                    raise
                try:
                    data = json.loads(msg)
                except Exception:
                    continue
                if data.get("type") == "ping":
                    await ws.send_json({"type": "pong", "ts": int(time.time()*1000)})

        async def _send():
            while True:
                evt = await queue.get()
                await ws.send_json(evt)

        await asyncio.gather(_recv(), _send())
    except WebSocketDisconnect:
        pass
    finally:
        unsub()


# ─── Helpers ────────────────────────────────────────────────────────────

def _speak_line(intent, result, transcript, needs_confirm: bool) -> str:
    if needs_confirm:
        return "Confirmation required. This action is marked destructive."
    name = intent.name
    if name == "status":
        return f"Status report incoming. Scanning hunter {intent.slots.get('agent','unknown')}."
    if name == "spawn":
        return f"Summoning new hunter. Agent {intent.slots.get('agent','unknown')} dispatched."
    if name == "dispatch":
        return "Quest accepted. Hunter dispatched."
    if name == "kill":
        return "Dismissing shadow. Hunter returning to the void."
    if name == "crons":
        return "Loading quest board."
    if name == "presence":
        return "Enumerating active hunters."
    if name == "cron.run":
        return "Executing quest now."
    if name == "snapshot":
        return "Canvas snapshot requested."
    if name == "theme":
        return "Shadow mode toggled."
    if name == "unknown":
        return f"Unknown command. I heard: {transcript}"
    return "Acknowledged."


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("HUNTEROS_PORT", "7777"))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=False, log_level="info")
