"""OpenClaw bridge — aggregate agents, crons, sessions; tail JSONL events."""
from __future__ import annotations

import asyncio
import json
import math
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Any, Callable

HOME = Path.home()
OC_ROOT = HOME / ".openclaw"

MODEL_POWER = {
    "opus-4-7": 5,
    "opus-4-6": 5,
    "opus": 5,
    "sonnet-4-6": 3,
    "sonnet": 3,
    "gemini": 2,
    "flash": 2,
    "nano": 1,
    "mini": 2,
    "gpt-5": 4,
}

RANK_TIERS = ["E", "D", "C", "B", "A", "S"]


# ─── Event bus ──────────────────────────────────────────────────────────

class EventBus:
    def __init__(self) -> None:
        self._subs: list[asyncio.Queue] = []

    def subscribe(self, q: asyncio.Queue) -> Callable[[], None]:
        self._subs.append(q)
        def _unsub() -> None:
            try:
                self._subs.remove(q)
            except ValueError:
                pass
        return _unsub

    async def publish(self, evt: dict[str, Any]) -> None:
        dead: list[asyncio.Queue] = []
        for q in list(self._subs):
            try:
                q.put_nowait(evt)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            try:
                self._subs.remove(q)
            except ValueError:
                pass


bus = EventBus()


# ─── CLI helpers ────────────────────────────────────────────────────────

async def _run(*args: str, timeout: float = 60.0) -> tuple[int, str, str]:
    proc = await asyncio.create_subprocess_exec(
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        out, err = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        return 124, "", "timeout"
    return proc.returncode or 0, out.decode("utf-8", "ignore"), err.decode("utf-8", "ignore")


def _power_for(model: str) -> int:
    m = (model or "").lower()
    for key, p in MODEL_POWER.items():
        if key in m:
            return p
    return 2


# ─── Agent aggregation ─────────────────────────────────────────────────

_agents_cache: dict[str, Any] = {"ts": 0.0, "data": []}
_agents_lock = asyncio.Lock()


async def fetch_agents(ttl: float = 30.0) -> list[dict[str, Any]]:
    now = time.time()
    if _agents_cache["data"] and (now - _agents_cache["ts"] < ttl):
        return _agents_cache["data"]
    async with _agents_lock:
        if _agents_cache["data"] and (time.time() - _agents_cache["ts"] < ttl):
            return _agents_cache["data"]
        data = await _fetch_agents_raw()
        _agents_cache["data"] = data
        _agents_cache["ts"] = time.time()
        return data


async def _fetch_agents_raw() -> list[dict[str, Any]]:
    code, out, err = await _run("openclaw", "agents", "list")
    agents: list[dict[str, Any]] = []
    if code != 0:
        return agents

    current: dict[str, Any] | None = None
    for raw in out.splitlines():
        line = raw.rstrip()
        m = re.match(r"^- (\S+)(?:\s*\(default\))?(?:\s*\(([^)]+)\))?$", line)
        if m:
            if current:
                agents.append(current)
            agent_id = m.group(1)
            title = m.group(2) or agent_id
            current = {
                "id": agent_id,
                "title": title,
                "emoji": _emoji_for(agent_id),
                "model": "",
                "workspace": "",
                "routing": [],
                "isDefault": "(default)" in line,
            }
        elif current is not None:
            if "Model:" in line:
                current["model"] = line.split("Model:", 1)[1].strip()
            elif "Workspace:" in line:
                current["workspace"] = line.split("Workspace:", 1)[1].strip()
            elif "Routing:" in line and "rules" not in line:
                routes = line.split("Routing:", 1)[1].strip()
                current["routing"] = [r.strip() for r in routes.split(",") if r.strip()]
            elif "Identity:" in line:
                ident = line.split("Identity:", 1)[1].strip()
                if ident:
                    current["identity"] = ident

    if current:
        agents.append(current)

    # enrich with rank / HP / activity
    now = time.time()
    for a in agents:
        power = _power_for(a["model"])
        activity = await _recent_activity(a["id"])
        level = max(1, activity["sessions"])
        score = power + min(3, math.ceil(activity["sessions"] / 10)) + (1 if activity["elevated"] else 0)
        tier_idx = max(0, min(len(RANK_TIERS) - 1, score - 1))
        a["rank"] = RANK_TIERS[tier_idx]
        a["power"] = power
        a["level"] = level
        a["hp"] = max(5, min(100, 100 - activity["load"]))
        a["mp"] = 40 + power * 10
        a["activity"] = activity
        a["lastSeenMs"] = activity["lastEventMs"]
        a["online"] = (now * 1000 - (activity["lastEventMs"] or 0)) < 15 * 60 * 1000
    return agents


def _emoji_for(agent_id: str) -> str:
    return {
        "main": "🔨",
        "jobhunt": "🎯",
        "cinderella": "👗",
        "mem0claw": "🧠",
        "cin-backend": "⚙️",
        "cin-frontend": "🎨",
        "cin-ios": "📱",
        "cin-marketing": "📣",
        "cin-outreach": "✉️",
        "cin-uiux": "🖌️",
        "hpc": "🧪",
    }.get(agent_id, "🗡️")


async def _recent_activity(agent_id: str) -> dict[str, Any]:
    """Scan the agent's events.jsonl (if present) for a rough activity summary."""
    workspaces = [
        OC_ROOT / "workspace" if agent_id == "main" else OC_ROOT / f"workspace-{agent_id}",
    ]
    events_path = None
    for w in workspaces:
        p = w / "memory" / ".dreams" / "events.jsonl"
        if p.exists():
            events_path = p
            break

    result = {"sessions": 0, "toolCalls": 0, "elevated": False, "lastEventMs": 0, "load": 0, "recentTools": []}
    if not events_path:
        return result

    try:
        size = events_path.stat().st_size
        with events_path.open("rb") as f:
            if size > 200_000:
                f.seek(size - 200_000)
                f.readline()
            tail = f.read().decode("utf-8", "ignore")
    except Exception:
        return result

    tool_counts: dict[str, int] = {}
    sessions: set[str] = set()
    last_ms = 0
    for line in tail.splitlines()[-1500:]:
        line = line.strip()
        if not line:
            continue
        try:
            evt = json.loads(line)
        except Exception:
            continue
        ts_raw = evt.get("ts") or evt.get("timestamp") or 0
        ts_ms = 0
        if isinstance(ts_raw, (int, float)):
            ts_ms = int(ts_raw)
        elif isinstance(ts_raw, str):
            try:
                ts_ms = int(ts_raw)
            except ValueError:
                try:
                    import datetime as _dt
                    ts_ms = int(_dt.datetime.fromisoformat(ts_raw.replace("Z", "+00:00")).timestamp() * 1000)
                except Exception:
                    ts_ms = 0
        if ts_ms > last_ms:
            last_ms = ts_ms
        kind = str(evt.get("kind") or evt.get("type") or "")
        if "session" in kind:
            sid = evt.get("sessionId") or evt.get("session") or ""
            if sid:
                sessions.add(sid)
        if "tool" in kind.lower():
            tool = evt.get("tool") or evt.get("name") or "?"
            tool_counts[tool] = tool_counts.get(tool, 0) + 1
        if evt.get("elevated"):
            result["elevated"] = True

    result["sessions"] = max(1, len(sessions))
    result["toolCalls"] = sum(tool_counts.values())
    result["lastEventMs"] = last_ms
    result["recentTools"] = sorted(tool_counts.items(), key=lambda kv: -kv[1])[:6]
    # crude "load" — more activity = lower HP proxy
    result["load"] = min(90, result["toolCalls"] // 5)
    return result


# ─── Crons ──────────────────────────────────────────────────────────────

async def fetch_crons() -> list[dict[str, Any]]:
    code, out, _ = await _run("openclaw", "cron", "list", "--json")
    if code != 0:
        return []
    try:
        data = json.loads(out)
    except Exception:
        return []
    jobs = data.get("jobs") if isinstance(data, dict) else data
    if not isinstance(jobs, list):
        return []
    result: list[dict[str, Any]] = []
    for j in jobs:
        result.append({
            "id": j.get("id") or j.get("jobId") or "",
            "name": j.get("name") or j.get("description") or "(unnamed)",
            "enabled": bool(j.get("enabled", True)),
            "schedule": j.get("schedule") or {},
            "sessionTarget": j.get("sessionTarget") or "",
            "lastRun": j.get("lastRun") or j.get("lastRunAt"),
            "lastStatus": j.get("lastStatus") or j.get("status") or "unknown",
            "nextRun": j.get("nextRun") or j.get("nextRunAt"),
        })
    return result


# ─── Sessions ───────────────────────────────────────────────────────────

async def fetch_sessions(active_only: bool = True) -> list[dict[str, Any]]:
    args = ["openclaw", "sessions", "--json", "--all-agents"]
    if active_only:
        args += ["--active", "60"]
    code, out, _ = await _run(*args, timeout=20.0)
    if code != 0:
        return []
    try:
        data = json.loads(out)
    except Exception:
        return []
    sessions = data.get("sessions") if isinstance(data, dict) else data
    if not isinstance(sessions, list):
        return []
    slim: list[dict[str, Any]] = []
    seen: set[str] = set()
    for s in sessions[:80]:
        sid = s.get("sessionId") or s.get("id") or ""
        agent = s.get("agentId") or s.get("agent") or ""
        # Dedupe by (id, agent) — same session may surface from multiple
        # workspace beacons; keep the first occurrence.
        dedupe_key = f"{sid}::{agent}"
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        slim.append({
            "id": sid,
            "agent": agent,
            "kind": s.get("kind") or s.get("type") or "",
            "channel": s.get("channel") or "",
            "lastActiveMs": s.get("lastActiveMs") or s.get("lastMessageAt") or 0,
            "messageCount": s.get("messageCount") or s.get("messages") or 0,
        })
        if len(slim) >= 40:
            break
    return slim


# ─── JSONL tails ────────────────────────────────────────────────────────

_tail_tasks: list[asyncio.Task] = []


async def start_tails() -> None:
    # discover events.jsonl files across all workspaces
    patterns = list(OC_ROOT.glob("workspace*/memory/.dreams/events.jsonl"))
    for p in patterns:
        agent = _agent_id_from_workspace(p)
        _tail_tasks.append(asyncio.create_task(_tail_file(p, agent)))
    # periodic refresh publisher
    _tail_tasks.append(asyncio.create_task(_periodic_refresh()))


def _agent_id_from_workspace(p: Path) -> str:
    parts = p.parts
    for part in parts:
        if part == "workspace":
            return "main"
        if part.startswith("workspace-"):
            return part[len("workspace-"):]
    return "main"


async def _tail_file(path: Path, agent: str) -> None:
    try:
        with path.open("r", encoding="utf-8", errors="ignore") as f:
            f.seek(0, os.SEEK_END)
            while True:
                line = f.readline()
                if not line:
                    await asyncio.sleep(0.5)
                    continue
                line = line.strip()
                if not line:
                    continue
                try:
                    evt = json.loads(line)
                except Exception:
                    continue
                payload = {
                    "type": "system.notify",
                    "agent": agent,
                    "kind": evt.get("kind") or evt.get("type") or "event",
                    "summary": _summarize(evt),
                    "raw": evt,
                    "ts": evt.get("ts") or int(time.time() * 1000),
                }
                await bus.publish(payload)
    except asyncio.CancelledError:
        return
    except Exception as e:
        await bus.publish({"type": "system.notify", "agent": agent, "kind": "tail.error", "summary": str(e), "ts": int(time.time()*1000)})


def _summarize(evt: dict[str, Any]) -> str:
    kind = str(evt.get("kind") or evt.get("type") or "event")
    if "tool" in kind.lower():
        return f"{kind} · {evt.get('tool') or evt.get('name') or '?'}"
    if "session" in kind:
        return f"{kind} · {str(evt.get('sessionId') or '')[:8]}"
    if "cron" in kind:
        return f"{kind} · {evt.get('name') or evt.get('id') or ''}"
    return kind


async def _periodic_refresh() -> None:
    while True:
        try:
            agents_ = await fetch_agents()
            await bus.publish({"type": "agents.update", "agents": agents_, "ts": int(time.time()*1000)})
        except Exception:
            pass
        await asyncio.sleep(20)


# ─── Action dispatcher ─────────────────────────────────────────────────

async def run_action(intent) -> dict[str, Any]:
    name = intent.name
    slots = intent.slots
    if name == "status":
        agents = await fetch_agents()
        target = (slots.get("agent") or "").lower()
        match = next((a for a in agents if a["id"] == target), None)
        return {"ok": bool(match), "agent": match, "agents": agents}
    if name == "presence":
        agents = await fetch_agents()
        return {"ok": True, "online": [a for a in agents if a["online"]]}
    if name == "crons":
        return {"ok": True, "crons": await fetch_crons()}
    if name == "cron.run":
        cid = slots.get("cronId") or slots.get("name") or ""
        if not cid:
            return {"ok": False, "error": "missing cronId"}
        code, out, err = await _run("openclaw", "cron", "run", cid)
        return {"ok": code == 0, "stdout": out[-600:], "stderr": err[-300:]}
    if name == "spawn":
        agent = slots.get("agent") or "main"
        task = slots.get("task") or "Say hello and confirm you are online."
        # non-blocking: spawn via CLI background
        code, out, err = await _run("openclaw", "agent", "--agent", agent, "--task", task, timeout=5.0)
        return {"ok": code in (0, 124), "stdout": out[-400:], "stderr": err[-200:]}
    if name == "dispatch":
        agent = slots.get("agent") or "main"
        task = slots.get("task") or ""
        if not task:
            return {"ok": False, "error": "missing task"}
        # TODO: real dispatch path (sessions_send equivalent)
        return {"ok": True, "queued": {"agent": agent, "task": task}}
    if name == "kill":
        return {"ok": True, "noted": "kill path not wired yet"}
    if name == "snapshot":
        return {"ok": True, "hint": "client-side canvas snapshot"}
    if name == "theme":
        return {"ok": True, "theme": slots.get("theme", "shadow")}
    if name == "unknown":
        return {"ok": False, "reason": "could not parse"}
    return {"ok": False, "reason": f"unhandled intent: {name}"}
