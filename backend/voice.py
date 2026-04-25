"""Voice layer — Whisper STT + ElevenLabs TTS via sag."""
from __future__ import annotations

import asyncio
import os
import uuid
from pathlib import Path
from typing import Optional

import httpx

OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
STT_MODEL = os.getenv("HUNTEROS_STT_MODEL", "whisper-1")
DEFAULT_VOICE = os.getenv("HUNTEROS_TTS_VOICE", "Clawd")


async def transcribe(audio_path: str) -> str:
    """Send audio to OpenAI Whisper API, return transcript. Local whisper fallback."""
    if OPENAI_KEY:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                with open(audio_path, "rb") as f:
                    files = {"file": (os.path.basename(audio_path), f.read(), "audio/webm")}
                data = {"model": STT_MODEL, "language": "en"}
                r = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {OPENAI_KEY}"},
                    data=data,
                    files=files,
                )
                if r.status_code == 200:
                    return (r.json().get("text") or "").strip()
        except Exception as e:
            print(f"[voice] whisper api error: {e}")
    # Fallback: local whisper CLI (slower)
    try:
        proc = await asyncio.create_subprocess_exec(
            "whisper", audio_path, "--model", "tiny", "--output_format", "txt",
            "--fp16", "False", "--language", "en",
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        out, _ = await proc.communicate()
        return out.decode("utf-8", "ignore").strip().splitlines()[-1] if out else ""
    except Exception:
        return ""


async def synth_tts(text: str, out_dir: Path, voice: Optional[str] = None) -> Optional[str]:
    """Use sag (ElevenLabs) CLI to synthesize speech, return filename under out_dir."""
    if not text.strip():
        return None
    fname = f"tts-{uuid.uuid4().hex}.mp3"
    out_path = out_dir / fname
    v = voice or DEFAULT_VOICE
    try:
        proc = await asyncio.create_subprocess_exec(
            "sag", "-v", v, "-o", str(out_path), text,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        _, err = await asyncio.wait_for(proc.communicate(), timeout=25)
        if proc.returncode == 0 and out_path.exists() and out_path.stat().st_size > 0:
            return fname
        print(f"[voice] sag failed rc={proc.returncode} err={err.decode('utf-8','ignore')[:200]}")
    except Exception as e:
        print(f"[voice] sag error: {e}")
    return None
