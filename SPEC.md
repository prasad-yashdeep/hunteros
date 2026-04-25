# HunterOS — Voice-Controlled Multi-Agent Orchestration Dashboard

> **Arise.** A Solo Leveling–themed command center for OpenClaw.

## Vision

HunterOS turns OpenClaw's multi-agent fleet into a live battle dashboard styled after Sung Jinwoo's System interface — translucent blue holograms, ranked hunters, quest boards, particle FX, voice commands. Control everything by speaking.

## Core Concepts

| Concept | Mapped to |
|---|---|
| Hunter | OpenClaw agent (main, jobhunt, cinderella, …) |
| Rank (E/D/C/B/A/S) | Derived from model power × 7-day activity |
| HP bar | Session token remaining / budget |
| MP bar | Elevated / tool access level |
| Skill tree | Recent tool calls (most-used = unlocked skills) |
| Level | Total sessions completed |
| Quest | Cron job |
| Quest status | Last run result (`ok` / `error` / `running`) |
| Dungeon | Active session / long-running task |
| Shadow soldier | Spawned sub-agent |
| System notification | Event from gateway WS or JSONL tail |

## Rank Derivation

```
base = {opus: 5, sonnet: 3, gemini-flash: 2, nano: 1}
score = base + ceil(sessions_7d / 10) + (has_elevated ? 1 : 0)
rank  = clamp(score → [E D C B A S])
```

S-rank = glowing violet border + crown icon. E-rank = grey, faded.

## Voice Pipeline

```
Mic (press-to-talk)
 → WebM/Opus blob
 → POST /voice/command (multipart)
 → Whisper API (STT, ~300-600ms)
 → Intent router (regex → LLM fallback)
 → Action dispatcher (openclaw CLI / gateway.call)
 → Result → TTS queue (ElevenLabs via sag)
 → Audio back to client via WS `tts-ready` event
```

### Intent Grammar (v1)

| Utterance | Intent | Action |
|---|---|---|
| "Arise, spawn a new {agent} hunter" | `spawn` | `sessions_spawn` |
| "Status report on {agent}" | `status` | agent detail panel focus |
| "Send {agent} on quest: {task}" | `dispatch` | `sessions_send` |
| "Dismiss {agent}" / "End {agent}" | `kill` | `subagents kill` |
| "Show me all quests" | `crons` | focus quest board |
| "Run quest {name}" | `cron.run` | `openclaw cron run` |
| "Who is online?" | `presence` | list active agents |
| "Snapshot the canvas" | `snapshot` | canvas snapshot |
| "Toggle shadow mode" | `theme` | dark→shadow palette |

Destructive intents (kill, cron.rm) require confirmation modal.

## Backend API

- `GET  /agents` → list of hunters with computed rank/HP/MP
- `GET  /crons` → list of quests + last run status
- `GET  /sessions?active=1` → active dungeons
- `WS   /stream` → event firehose (agent.update, quest.update, session.event, system.notify)
- `POST /voice/command` (multipart) → { transcript, intent, action, result, ttsUrl? }
- `POST /command` (JSON) → structured command dispatch (same intent → action path, no STT)
- `POST /tts` → ElevenLabs readback → mp3 URL

## Frontend Layout

```
╭─────────────────────────── HunterOS ────────────────── [◉ REC] ─╮
│  SYSTEM — LEVEL 47                         Shadow Monarch: Operator │
├──────────────┬──────────────────────────┬───────────────────────┤
│ HUNTERS (5)  │  DUNGEONS (active)       │  SYSTEM LOG           │
│              │                          │                       │
│ [S] main 🔨  │  ▸ main · @telegram      │ > agent.turn.started  │
│  HP ████░ 84 │    msg 7360 · 12s ago    │ > cron.run.success    │
│              │                          │ > spawn requested     │
│ [A] cinder👗 │  ▸ cinderella · @discord │ ...                   │
│  HP █████ 97 │    idle 3m                │                       │
│              │                          │                       │
│ [C] jobhunt🎯│                          │                       │
│  HP ███░░ 52 │                          │                       │
├──────────────┴──────────────────────────┴───────────────────────┤
│  QUESTS — 14 active                                             │
│  ⚔ LinkedIn Jobs Scan · every 8h · ok · next in 4h              │
│  ⚔ Outreach Drafter · every 8h · ok · next in 2h                │
│  ...                                                             │
╰──────────────────────────── ◉ Arise. ───────────────────────────╯
```

## Visual Identity

- **Palette**: `#0a0e27` (void) → `#1a2454` (abyss) bg; `#4a9eff` primary glow; `#9b4aff` monarch violet; `#ffcc00` quest gold; `#ff4a4a` danger crimson
- **Type**: Orbitron (headings) + JetBrains Mono (data) + Inter (body)
- **Effects**: backdrop-blur panels with 1px `#4a9eff` glowing borders, corner brackets `⌜⌝⌞⌟`, scanline overlay at 6% opacity
- **Animations**: text typewriter in, HP bars lerp, rank-up = violet shockwave + particle burst, "Arise" = column of particles

## Milestones (today)

- [ ] M1 — Scaffold, SPEC, theme CSS (30m)
- [ ] M2 — Backend REST + WS + agent aggregator (60m)
- [ ] M3 — Frontend shell: HunterGrid, QuestBoard, SystemLog, particles (90m)
- [ ] M4 — Voice pipeline end-to-end (60m)
- [ ] M5 — Polish: animations, level-up fx, Arise command (30m)
- [ ] M6 — Demo capture + README (30m)

## Out of Scope (today)

- Electron packaging (web app first)
- Local Whisper (API version ships first)
- Multi-user auth
- Persistent metrics DB (in-memory + JSONL tail only)
- True sub-100ms streaming STT (press-to-talk → API is <1s which is fine for demo)
