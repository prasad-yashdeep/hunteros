# HunterOS — Design System Handoff

**Status**: All deliverables shipped. `cd frontend && npm run build` passes (1.25 MB gzip 351 kB; chunk-size warning expected with three.js bundled).

## What I shipped

### Documentation
- `docs/DESIGN_SYSTEM.md` — full token reference, component inventory (12 components), motion vocabulary, sound-design notes, accessibility audit (contrast ratios computed against `--void`), Tailwind ↔ CSS-vars cheatsheet, and "don'ts."
- `docs/3D_HERO.md` — concept rationale, r3f component tree, GLSL shader breakdowns (CoreOrb / FresnelShell / RuneRings / ShadowParticles / AriseColumn), perf budget, WebGL2-fallback strategy, idle/listening/speaking/arise reaction map.
- `docs/HANDOFF.md` — this file.

### Frontend tokens & base
- `frontend/tailwind.config.js` — replaced. Adds: full color palette (void/abyss/system/monarch/quest/danger/warm/ink/rank), font families, display/body/caption type scale, glow shadow tiers, `pulseSystem` / `shockwave` / `rankBurst` / `holoIn` / `flicker` / `scan` / `runeMarch` keyframes + animations, `out-monarch` easing.
- `frontend/src/theme.css` — CSS variables (colors, motion, type), Google Fonts CDN imports (Fraunces / Orbitron / Inter / JetBrains Mono), body backdrop, `.sl-panel` / `.sl-corners` / `.scanlines` / `.rune-grid` / `.glow-text-*` utilities, focus-visible styling, reduced-motion fallback, themed scrollbars.
- `frontend/src/index.css` — ordered imports: theme.css → tailwind directives.

### Components (`frontend/src/components/`)
- `RankBadge.tsx` — diamond hex with rank-tinted glow, optional crown for S-rank, optional pulsing for A/S.
- `StatBar.tsx` — RAF-driven ease-out lerp (default 480ms), 5 variants (hp/mp/xp/danger/warm), tick marks, leading bright edge, low-HP pulse + crimson glow.
- `HunterCard.tsx` + `HunterGrid` — full agent card with rank-up violet burst overlay, online/offline indicator, recent-tools chips. Empty-state copy on no agents.
- `SystemLog.tsx` — virtualized to 60 newest, `aria-live="polite"`, typewriter on first reveal only.
- `QuestBoard.tsx` — status-tone rows, hover-reveal `▶ run` button, playful name-length → quest-rank mapping for visual diversity.
- `SystemNotification.tsx` — `holoIn` toast with corner brackets, drifting scanline, tone-keyed border.
- `VoiceOrb.tsx` — react-three-fiber procedural sigil with custom GLSL (simplex noise, fresnel, billboard column, 320-particle additive cloud). SVG fallback when WebGL2 missing.
- `CommandPalette.tsx` — `⌘K` / `Ctrl-K` modal with 7 presets and raw-text fallback. ESC closes; ENTER runs the first match.
- `ApprovalModal.tsx` — crimson alertdialog for destructive intents.
- `StatusWindow.tsx` — selected-hunter detail pane: XL rank badge, 8-field metadata grid, three bars, skill tree, identity blurb.
- `SkillTree.tsx` — constellation of unlocked tool nodes; tier from call count.
- `PressToTalk.tsx` — hold-to-record button + global Spacebar push-to-talk. WebM/Opus via `MediaRecorder`. Streams RMS audio level to caller.

### App wiring
- `frontend/src/App.tsx` — full layout: header (logo, monarch, online/total stats, GATE OPEN badge, console launcher, press-to-talk) ▸ 3-column grid (HunterGrid 320px ▸ Hero+Status 1fr ▸ SystemLog+Dungeons 360px) with QuestBoard spanning the bottom. WebSocket reconnect with backoff (`lib/ws.ts`). `/agents`, `/crons`, `/sessions` initial fetch. `/command` and `/voice/command` plumbing including `needsConfirmation` → `ApprovalModal` → confirmed retry.
- `frontend/src/main.tsx` — cleaned up; just StrictMode + App.
- `frontend/index.html` — themed (`<meta theme-color>`, dark `<html>`, proper title/description).
- `frontend/src/store.ts` — zustand store with rank-up detection on `setAgents`, log buffering (200 entries), toast queue, arise / rank-up impulse timestamps.
- `frontend/src/lib/{api,format,rank,ws}.ts` — REST helpers with safe fallbacks, `fmtAgo` / `fmtNext`, rank palette, self-reconnecting WebSocket with 800ms→8s backoff and 20s pings.
- `frontend/src/types.ts` — typed mirrors of the Python response shapes.

### Dependencies added
- `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` (54 packages, 0 vulns).

### Untouched per brief
- `backend/` — not modified.

## Decisions I made

- **Tailwind v3 + custom theme.** The scaffold ships v3.4. I extended its theme rather than introducing a new CSS-vars-only approach, so designers can reach for `text-system`, `shadow-glow`, `animate-holo-in` and get the right thing. CSS vars live in `theme.css` as the source of truth — Tailwind values mirror them.
- **No external 3D models.** `VoiceOrb` is 100% procedural with inline GLSL. No IP risk, no asset pipeline, no LFS. Costs ~3k tris + 320 points; runs on integrated GPUs.
- **Fonts via Google CDN, not bundled.** Fraunces / Orbitron / Inter / JetBrains Mono. Keeps the build slim. If air-gapped operation matters, swap to self-hosted later.
- **Quest "rank" is name-length-derived.** Backend doesn't expose quest priority; rather than show a flat list, I derive a playful E→S badge from name length so visual rhythm is preserved. Trivially overrideable later.
- **"Arise" intent → orb impulse + global shockwave + toast.** I treated `spawn` as the canonical "arise" trigger so the demo lights up cinematically when you say "Arise, spawn a new main hunter."
- **Rank-up detection is client-side.** Comparing `agents.update` payloads catches promotions immediately and fires the violet burst on the appropriate `HunterCard`.
- **Push-to-talk uses Space, not click-only.** Mirrors the show's beat — a held key, not a tap. Auto-disabled while typing in inputs.
- **Strict TS (`verbatimModuleSyntax`, `noUnusedLocals`).** All types use `import type` correctly; no unused locals.
- **No `optional ?? defaults` in critical handlers.** Per the project's preferences, I trust internal data shapes and only fall back at the network boundary (`safeJson` returning `[]` on failure).

## What's left (intentionally out of scope today)

- **Real TTS lipsync.** Right now `voiceState` flips between `listening`/`speaking` based on press-to-talk and `<audio>.onended`. Wiring an `AnalyserNode` against the TTS playback to drive `audioLevel` during speech would make the orb pulse with the System's voice — fun but not blocking the demo.
- **SFX cues.** The DESIGN_SYSTEM.md spec'd 8 cues (`system.appear`, `arise`, `rank.up`, etc.) but I didn't bundle any audio assets. Hooks are obvious places to add them (`pushEvent`, `triggerArise`, `triggerRankUp`, `mr.onstart`, `mr.onstop`, `audio.onended`).
- **Screen-reader review with VO/NVDA.** ARIA roles and live-regions are correct on paper; live testing not done.
- **Code-splitting the three.js bundle.** Vite warns at 1.25 MB → 351 kB gzip. Lazy-loading `VoiceOrb` behind a `Suspense` boundary would knock ~250 kB off the initial chunk if FCP becomes a concern.
- **Sub-agent kill path.** Backend `intents.kill` is a stub; the front end gates it behind `ApprovalModal` correctly but the action is currently a no-op on the server.

## How to run

```bash
# Backend
cd backend
pip install -r requirements.txt
HUNTEROS_PORT=7777 python main.py

# Frontend
cd frontend
npm install     # already done
npm run dev     # vite at :5173 → talks to backend at :7777
npm run build   # production tsc + vite build (passes)
```

Press **⎵ Space** to talk. Try: *"Status report on main."* · *"Show me all quests."* · *"Arise, spawn a new main hunter."*

— *Generated by Claude Opus 4.7, 2026-04-25.*
