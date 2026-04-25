# Brief for Claude Opus 4.7 — HunterOS Design System

## Context (READ FIRST)

1. Read `SPEC.md` in this directory — that's the product spec I drafted.
2. Skim `backend/openclaw_bridge.py` and `backend/intents.py` to understand the rank computation and intent vocabulary already in place.
3. Frontend scaffold is a fresh Vite + React + TS + Tailwind project in `frontend/` with `framer-motion`, `zustand`, `clsx` installed. Tailwind is initialized (`tailwind.config.js` exists, no customization yet).

## Your Mission — ultrathink, do not hold back

Design a cohesive, shippable-today **Design System** for **HunterOS** that fuses:

- **Solo Leveling "System" interface**: translucent blue holograms on void background, ranks E→S, quest board, shadow monarch violet accents, pulsating glow, particle fx, crisp status windows
- **Anthropic / Claude design DNA**: warm serif headings (Fraunces / Playfair), minimalist spacing, terracotta/amber as a secondary warm accent, high legibility, "invisible technology" restraint
- **3D hero elements**: at least one striking 3D centerpiece (rank sigil, monarch throne orb, rotating quest gate, particle shadow army) — propose concrete implementation via react-three-fiber + drei, with assets that can be generated procedurally (no copyrighted models)

## Deliverables (write all of these)

Create these files in this repo:

1. **`docs/DESIGN_SYSTEM.md`** — the full design system:
   - Design principles (5–7 bullets)
   - Color tokens with hex + CSS variable names + semantic usage (bg, fg, border, glow, rank palette, status, warm accent)
   - Typography scale + font stacks (Fraunces/Playfair for display, JetBrains Mono for data, Inter for body) with Tailwind config
   - Spacing, radius, elevation, glow tokens
   - Motion tokens (easings, durations, "arise" shockwave, rank-up burst, hp-bar lerp)
   - Component inventory with props + states: HunterCard, RankBadge, HPBar, MPBar, SkillTree, QuestRow, SystemLogLine, VoiceOrb (3D), CommandPalette, ApprovalModal, StatusWindow
   - Iconography + glyph set (corner brackets ⌜⌝⌞⌟, arise/shadow/monarch glyphs, rank letters)
   - Sound design notes (ElevenLabs voice persona for "the System", SFX cues)
   - Accessibility notes (contrast, motion-reduce, ARIA live regions for SystemLog)

2. **`docs/3D_HERO.md`** — the 3D hero spec:
   - The hero element concept(s) and why
   - Concrete react-three-fiber component outline with geometry, materials, shaders, lighting
   - Procedural asset strategy (no external models)
   - Performance budget (target 60fps on M-series Mac; fallback to Canvas2D if WebGL2 unavailable)
   - Interaction: idle states, on-"arise" reaction, on-rank-change reaction

3. **`frontend/tailwind.config.js`** — replace with the configured theme (colors, fonts, extended shadows/glows, keyframes for arise/pulse/shockwave)

4. **`frontend/src/theme.css`** — CSS variables, base body styles, font-face imports (prefer CDN for Fraunces + JetBrains Mono + Inter), scanline overlay utility, glow utilities, Solo Leveling panel base class `.sl-panel`

5. **`frontend/src/components/`** — implement at minimum these components as TSX with Tailwind + framer-motion:
   - `HunterCard.tsx` — takes `agent` prop matching backend `/agents` shape
   - `RankBadge.tsx` — renders E/D/C/B/A/S with tier-specific glow
   - `StatBar.tsx` — animated HP/MP bar with lerp
   - `SystemLog.tsx` — AR/typewriter entries, virtualized-ish
   - `QuestBoard.tsx` — quest rows from `/crons`
   - `VoiceOrb.tsx` — 3D hero via react-three-fiber (install `three`, `@react-three/fiber`, `@react-three/drei` yourself)
   - `SystemNotification.tsx` — the floating blue hologram toast

6. **`frontend/src/App.tsx`** — replace the Vite default with the full HunterOS layout wiring those components. Connect to backend at `http://127.0.0.1:7777` (REST) and `ws://127.0.0.1:7777/stream` (WebSocket). Include a press-to-talk button that POSTs recorded audio to `/voice/command` (use MediaRecorder → WebM) and plays back the returned `ttsUrl`.

7. **Update `frontend/src/index.css`** to import `theme.css` and set Tailwind directives.

## Constraints

- Keep it shippable today — prefer procedural 3D over asset pipelines
- Don't copy Solo Leveling trademarked assets; evoke the vibe with custom SVG/shader work
- All components must render without backend mocking — handle the empty state gracefully, then upgrade when data arrives via WS snapshot
- Use existing installed deps where possible; install new ones with `npm install` in `frontend/` if needed
- Don't break the backend. Don't touch `backend/` code.
- When done, run `cd frontend && npm run build` to ensure the project compiles, and fix any errors

## Work loudly

- Commit often to make review easy (git init if not yet done)
- At the end, write a short `docs/HANDOFF.md` summarizing what you shipped, what's left, and any decisions you made

## When completely finished

Run exactly this to notify the orchestrator:

```
openclaw system event --text "🔨 HunterOS design system + 3D hero + components ready for review" --mode now
```

Now go. ultrathink.
