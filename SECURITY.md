# Security

## Threat model

HunterOS is a **localhost-first orchestration dashboard**. The default configuration is intended for a single user on a single machine, wired to their own OpenClaw agents. **It is not hardened for multi-tenant or internet-exposed deployments.**

Anything you expose beyond `127.0.0.1` / `localhost` — a tunnel, a VPN, a LAN share, a reverse proxy — moves you outside the threat model and you are responsible for the extra hardening.

## What the backend does

- Shells out to the local `openclaw` CLI to read your agents / crons / sessions
- Tails JSONL event files under `~/.openclaw/workspace*/memory/.dreams/events.jsonl`
- Proxies voice audio to OpenAI (Whisper STT) and ElevenLabs (TTS via the `sag` CLI)
- Exposes REST + WebSocket endpoints on `127.0.0.1:7777` with **no authentication** and **`allow_origins=["*"]` CORS**
- Serves generated TTS files from `/tmp/hunteros-tts/`

## Known residual risks

| # | Risk | Severity | Status | Mitigation |
|---|------|----------|--------|------------|
| 1 | No authentication on any endpoint | Medium (localhost-only default) | By design | Don't expose the backend to the network. Bind to `127.0.0.1` (already the default). |
| 2 | `CORS allow_origins=["*"]` | Medium | By design | Any localhost-running page can hit your dashboard; that's fine for MVP. Tighten to the exact frontend origin before exposing beyond loopback. |
| 3 | `/voice/command` and `/command` run `openclaw` intents — arbitrary spawn/kill/cron ops | **High** if exposed | By design | Treat as admin-level API. Destructive intents (`kill`, `cron.rm`) require confirmation, but this is a *UX* gate, not an auth gate. |
| 4 | TTS file serving at `/tts/{fname}` | Low | **Patched** (v0.1.0) | Path traversal blocked: rejects `..`, `/`, `\`, leading `.`; resolves the candidate path and verifies it stays inside `TTS_DIR`. See `backend/main.py::tts_file`. |
| 5 | Subprocess invocation | Low | By design | `asyncio.create_subprocess_exec(*args, …)` with positional args (no `shell=True`), so no shell injection from user input. The `openclaw` binary is assumed trustworthy. |
| 6 | Frontend renders event `text` fields | Low | Safe | Rendered as React text nodes — **no `dangerouslySetInnerHTML`** anywhere in the codebase. Server-emitted strings are not HTML-interpolated. |
| 7 | Outbound API calls | Informational | N/A | The backend talks to `api.openai.com` (STT) and ElevenLabs (via `sag`). No other outbound. |
| 8 | Dependencies | Informational | Scanned | `npm audit` — 0 vulnerabilities at release. Python deps pinned with `>=` minimums in `requirements.txt`. |

## Secrets handling

- API keys (`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`) are read **only** from environment variables
- **No secrets** are written to logs, served over the API, or included in responses
- `.env` is gitignored; only `.env.example` is committed
- Git history scanned with regex for `sk-…`, `ghp_…`, `gho_…`, `xoxb-…`, `AKIA…`, `AIza…`, passwords — **clean** across all commits at release

## Reporting a vulnerability

Found something? Open a **private** GitHub security advisory at
https://github.com/prasad-yashdeep/hunteros/security/advisories/new
or open a regular issue if it's a minor concern.

## Hardening checklist (before exposing beyond localhost)

- [ ] Tighten CORS to the exact frontend origin
- [ ] Add bearer-token or mTLS auth on all REST + WS endpoints
- [ ] Proxy through a reverse proxy with rate limits (nginx / Caddy)
- [ ] Require fresh confirmation for every destructive intent (right now confirmation bypass is only a UX modal)
- [ ] Audit log every command + voice transcript to a rotating file
- [ ] Sandbox the `openclaw` subprocess (runtime user / cgroup / macOS Seatbelt)
- [ ] Rate-limit `/voice/command` — Whisper is a paid API
- [ ] Pin Python deps to exact versions in `requirements.txt`
- [ ] Enable Dependabot + `npm audit` in CI
