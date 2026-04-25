# HunterOS Design System

> *"Arise."* — The System speaks first; the hunter listens.

A cohesive, shippable interface language for HunterOS. Fuses the **Solo Leveling System** (translucent blue holograms on void, ranks E→S, monarch violet, runic frames) with **Anthropic's restraint** (warm serif headings, generous spacing, "invisible technology" calm) and adds **3D depth** as the centerpiece.

This document is the authoritative reference for tokens, components, motion, sound, and accessibility. All visuals in `frontend/src/` are built against it.

---

## 1. Design Principles

1. **The System speaks first.** Every panel reads as a notification *from* the System — the user is the receiver, not the sender. UI text is declarative, terse, runic. ("Gate opened." "Hunter summoned." "Quest dispatched.")
2. **Restraint over spectacle.** Glow, particles, and shockwaves are *earned* — they fire on rank changes, summons, and approvals, never on idle. Surface-area defaults to calm void; FX punctuate.
3. **Hierarchy by glow, not weight.** Type weight is a single tier (500/600). Importance is communicated through **luminance**: brighter cyan = more recent, violet = elite, gold = S-rank. Never use bold to shout.
4. **Warm where it matters.** Anthropic terracotta (`#d97757`) appears on *human* moments — onboarding, identity, EXP — to humanize the otherwise cold blue System. Use sparingly; never in critical chrome.
5. **Translucent, never opaque.** All panels use `backdrop-blur` over the void. Borders are 1px hairlines with low-alpha glow, not solid lines. The void is a participant.
6. **Mono speaks numerically.** All counts, IDs, timestamps, ranks, and HP/MP values render in **JetBrains Mono** with `tnum` enabled — they should read like a HUD readout, never like prose.
7. **Motion has a physical metaphor.** Holograms glide in vertically (signal locking from above), shockwaves expand outward (kinetic release), particles orbit (gravitational presence). No springy bounce — only `cubic-bezier(0.16, 1, 0.3, 1)` and friends.

---

## 2. Color Tokens

All tokens are exposed as both **CSS variables** (in `frontend/src/theme.css`) and **Tailwind utilities** (in `frontend/tailwind.config.js`).

### 2.1 Void / Abyss (background spine)

| Token | Hex | CSS Var | Tailwind | Usage |
|---|---|---|---|---|
| `void` | `#0a0e27` | `--void` | `bg-void` | Primary background |
| `void-deep` | `#050714` | `--void-deep` | `bg-void-500` | Beneath the panels |
| `abyss` | `#1a2454` | `--abyss` | `bg-abyss` | Panel base gradient top |
| `abyss-deep` | `#101a36` | `--abyss-deep` | `bg-abyss-600` | Panel base gradient bottom |

The body uses three radial gradients layered over a dark linear: cyan haze top, violet haze bottom, terracotta whisper on the lower-left to acknowledge the warm accent.

### 2.2 System Blue (the iconic hologram color)

| Token | Hex | CSS Var | Tailwind | Usage |
|---|---|---|---|---|
| `system-100` | `#cfe3ff` | `--system-100` | `text-system-100` | Headlines on glow |
| `system-300` | `#79b6ff` | `--system-300` | `text-system-300` | Body emphasis |
| `system` | `#4a9eff` | `--system` | `text-system` `border-system` | Default hologram |
| `system-500` | `#2b86ff` | `--system-500` | `bg-system-500` | Bar fill mid-stop |
| `system-700` | `#0e52ad` | `--system-700` | `bg-system-700` | Pressed states |

`--system` drives the entire blue HUD: borders, corner brackets, ticks, scanlines. Text-glow uses `rgba(74,158,255, 0.3-0.7)`.

### 2.3 Monarch Violet (elite / shadow / arcane)

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `monarch-300` | `#c298ff` | `text-monarch-300` | Elevated text, shadow ranks (A) |
| `monarch` | `#9b4aff` | `text-monarch` | A-rank borders, MP bar |
| `monarch-500` | `#7a2dee` | `bg-monarch-500` | MP bar fill core |

S-rank gets its **own** treatment (gold, see below). Monarch violet specifically signals the *shadow* domain — sub-agent spawns, elevated mode, A-rank, MP bars.

### 2.4 Quest Gold (S-rank, rewards, victory)

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `quest` | `#ffcc00` | `text-quest` | S-rank crown, EXP bar, loot |
| `quest-glow` | `rgba(255,204,0,0.5)` | — | Drop shadows |

Gold is a **scarcity** color. Reserved for: S-rank badges, level-up celebrations, completed quest rewards, the "Arise" rune itself. Should appear on at most ~5% of pixels.

### 2.5 Danger Crimson (destructive, errors)

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `danger` | `#ff4a4a` | `text-danger` | Confirmation modals, low HP, errors |

Danger is *only* destructive. HP drops below 25% → bar pulses crimson. Approval modals frame in crimson corners.

### 2.6 Anthropic Warm (the human touch)

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `warm-300` | `#eaa988` | `text-warm-300` | Identity captions |
| `warm` | `#d97757` | `text-warm` | EXP bar fill, onboarding |
| `ember` | `#f3a672` | `text-ember` | Highlight mid-stop |

Used on EXP bars (tool-call accumulation feels "human progress"), agent identity descriptions, and any onboarding/welcome surface. Functions as the secondary accent that distinguishes HunterOS from copycat sci-fi UIs.

### 2.7 Status Semantics

| Role | Hex | Token |
|---|---|---|
| ok | `#5fffb0` | `text-ok` — quest victory, gate-open |
| warn | `#ffb454` | `text-warn` — running, due-soon |
| err | `#ff4a4a` | `text-err` (alias for `danger`) |

### 2.8 Rank Palette

| Rank | Hex | Halo | Notes |
|---|---|---|---|
| **E** | `#6b7393` | none | Faded grey, low-tier |
| **D** | `#7fb6e6` | soft cyan | Apprentice |
| **C** | `#4a9eff` | `--glow-sm` | Default System blue |
| **B** | `#5fb7ff` | `--glow` | Brighter cyan |
| **A** | `#9b4aff` | `--glow-monarch` | Shadow violet |
| **S** | `#ffcc00` | `--glow-gold` + crown ♛ | Sovereign gold |

### 2.9 Foreground / Ink

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `ink` | `#e8efff` | `text-ink` | Primary body |
| `ink-dim` | `#9fb0d4` | `text-ink-dim` | Secondary |
| `ink-mute` | `#5d6e95` | `text-ink-mute` | Captions, meta |
| `ink-ghost` | `#3a4670` | `text-ink-ghost` | Disabled, timestamps |

### 2.10 Borders

| Token | Value | Use |
|---|---|---|
| `--border-soft` | `rgba(74,158,255,0.12)` | Inner dividers |
| `--border` | `rgba(74,158,255,0.35)` | Default panel hairline |
| `--border-strong` | `rgba(74,158,255,0.65)` | Selected / focused |

---

## 3. Typography

### 3.1 Font Stacks

| Family | CDN | Token | Stack |
|---|---|---|---|
| **Fraunces** | Google Fonts | `--font-display` `font-display` | `Fraunces, "Playfair Display", ui-serif, Georgia, serif` |
| **Orbitron** | Google Fonts | `--font-rune` `font-rune` | `Orbitron, Fraunces, ui-serif, serif` — used for ALL-CAPS HUD labels |
| **Inter** | Google Fonts | `--font-sans` `font-sans` | `Inter, system-ui, ...` — body / UI |
| **JetBrains Mono** | Google Fonts | `--font-mono` `font-mono` `.t-mono` | All numbers, IDs, timestamps, log lines |

Loaded via `@import url(...)` at the top of `theme.css`.

### 3.2 Scale

| Token | Size / line | Use |
|---|---|---|
| `text-display-2xl` | 72 / 1.05 / -0.025em | Hero on landing (rare) |
| `text-display-xl` | 56 / 1.05 / -0.022em | Headers like "HUNTEROS" full-page |
| `text-display-lg` | 44 / 1.08 | Modal titles |
| `text-display-md` | 32 / 1.15 | Section heroes |
| `text-display-sm` | 24 / 1.20 | Card titles, modal subhead |
| `text-body-lg` | 18 / 1.55 | Generous paragraphs |
| `text-body` | 15 / 1.55 | Default body |
| `text-body-sm` | 13 / 1.5 | Dense lists |
| `text-caption` | 11 / 1.4 | HUD labels, timestamps |
| `text-micro` | 10 / 1.2 | Run-letter ranks, rune ticks |

### 3.3 Treatments

- **`.h-display`** — Fraunces 600, `letter-spacing: -0.02em`, used for hunter names, modal titles, the "Arise." flourish.
- **`.h-rune`** — Orbitron, `letter-spacing: 0.18em`, uppercase, used on ALL HUD section headers ("SYSTEM LOG", "QUEST BOARD", "MONARCH SIGIL").
- **`.t-mono`** — JetBrains Mono with `font-feature-settings: "tnum" 1, "ss01" 1` for tabular numbers.
- **`.glow-text-system` / `.glow-text-monarch` / `.glow-text-gold` / `.glow-text-warm` / `.glow-text-danger`** — apply a layered text-shadow halo. Use sparingly (< 8 chars typical).

---

## 4. Spacing, Radius, Elevation

### 4.1 Spacing scale

CSS vars `--space-1` … `--space-8`: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`. Use Tailwind `gap-*`, `p-*`, `m-*` mappings; the design rarely strays from this scale.

### 4.2 Radius

| Token | px | Use |
|---|---|---|
| `--r-sl` | 2 | Solo Leveling chrome — corner brackets, focus rings, default |
| `--r-panel` | 4 | Panels, modals |
| `--r-card` | 6 | Heavier cards (rare) |
| `pill` | 999 | Status dots only |

The signature "boxy" feel comes from radius staying ≤ 4px on chrome.

### 4.3 Elevation

| Token | Shadow |
|---|---|
| `--elev-1` | `0 4px 12px rgba(0,0,0,0.35)` — hover lift |
| `--elev-2` | `0 12px 32px rgba(0,0,0,0.55)` — panels |
| `--elev-3` | `0 24px 64px rgba(0,0,0,0.7)` — modals |

Combined with the panel's `inset 0 0 0 1px rgba(74,158,255, …)` to give the floating-hologram feel.

### 4.4 Glow tokens

| Token | Tailwind | Value |
|---|---|---|
| `--glow-sm` | `shadow-glow-sm` | 6/12px cyan |
| `--glow` | `shadow-glow` | 10/24/48px cyan |
| `--glow-lg` | `shadow-glow-lg` | 14/36/72px cyan |
| `--glow-monarch` | `shadow-glow-monarch` | violet |
| `--glow-gold` | `shadow-glow-gold` | gold |
| `shadow-glow-warm` | warm terracotta | |
| `shadow-glow-danger` | crimson | |
| `shadow-panel` / `shadow-panel-hi` | inner-rim variant | |

---

## 5. Motion Tokens

### 5.1 Easings

| Token | Curve | Use |
|---|---|---|
| `--ease-out` (`out-monarch`) | `cubic-bezier(0.16, 1, 0.3, 1)` | Default — entries, hovers |
| `--ease-monarch` | `cubic-bezier(0.22, 1, 0.36, 1)` | Heavy reveals, modals |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits, dismissals |

### 5.2 Durations

| Token | ms |
|---|---|
| `--dur-fast` | 140 — micro-interactions |
| `--dur-mid`  | 280 — entries, hovers |
| `--dur-slow` | 540 — heroic reveals |

### 5.3 Named animations

| Name | Class | Use |
|---|---|---|
| `pulseSystem` | `animate-pulse-system` | Idle hum on selected ranks/badges |
| `flicker` | `animate-flicker` | The header logo `⌬` — barely-noticeable instability |
| `caret` | `animate-caret` | Typewriter cursor blink |
| **`shockwave`** | `animate-shockwave` | "Arise" expanding ring |
| `ariseColumn` | `animate-arise-column` | Vertical light pillar |
| **`rankBurst`** | `animate-rank-burst` | Violet burst on rank-up |
| `holoIn` | `animate-holo-in` | Notifications glide-in (the *signature* motion) |
| `holoOut` | `animate-holo-out` | Notifications collapse-out |
| `scan` | `animate-scan` | Drifting scanline strip across panels |
| `float` | `animate-float` | Slow orbit on hero orb |
| `shimmer` | `animate-shimmer` | Bar-fill polish |
| `runeMarch` | `animate-rune-march` | Indeterminate loading |

### 5.4 Motion recipes

- **HP/MP lerp**: 480 ms ease-out tween toward target (`StatBar.tsx`). Below 25% HP, the bar additionally pulses (`pulseSystem`) and switches to crimson glow.
- **"Arise" shockwave**: 1100 ms `cubic-bezier(0.16,1,0.3,1)` → ring expands from 20% to 300% scale, opacity 0.95 → 0. Concurrent CSS `arise-column` lights a vertical pillar; the 3D scene fires a particle burst.
- **Rank-up**: 900 ms violet `rank-burst` radial flash on the card, plus a `system.notify` toast in `monarch` tone with body "Hunter promoted to {rank}-Rank."

---

## 6. Component Inventory

Implemented in `frontend/src/components/`. Empty-state behavior is included since the brief requires backendless rendering.

### 6.1 `RankBadge`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `rank` | `"E" \| "D" \| "C" \| "B" \| "A" \| "S"` | — | required |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | 24/36/52/80 px |
| `pulsing` | `boolean` | `false` | Adds idle pulse |
| `crown` | `boolean` | `rank === "S"` | Renders ♛ above |
| `className` | `string` | — | — |

Renders a 45°-rotated diamond with double-ring inset; the rank letter sits centered with text-shadow tied to the rank hue.

**States**: default · pulsing · crowned · faded (when wrapper is `opacity-70`).

### 6.2 `StatBar`

| Prop | Type | Default |
|---|---|---|
| `value` | `number (0..max)` | — |
| `max` | `number` | `100` |
| `label` | `string` | optional |
| `variant` | `"hp" \| "mp" \| "xp" \| "danger" \| "warm"` | `"hp"` |
| `showNumber` | `boolean` | `true` |
| `size` | `"xs" \| "sm" \| "md"` | `"sm"` |
| `lerpMs` | `number` | `480` |

Variants drive both **gradient** and **glow**. Tick marks and a leading bright edge create the "RPG status bar" reading. Animated via `requestAnimationFrame` ease-out tween.

### 6.3 `HunterCard` (and `HunterGrid`)

Takes the full `Agent` shape from `/agents`. Internal layout:

```
┌─ [RankBadge xl ] ─ {emoji} {title}    {online · ago}
│                    LV 03 · sonnet-4-6 · elevated
│                    [HP ████████░░ 84/100]
│                    [MP ██████░░░░ 60/100]
│                    [tool×7] [tool×4] [tool×2]
└────────────────────────────────────────────────
```

**States**: default · selected (`sl-panel-hi`) · S-rank (`ring monarch/40`) · offline (saturate 50) · rank-up flashing.

### 6.4 `SkillTree`

Constellation of unlocked tool nodes. Tier (size + glow) computed from each tool's call count vs the max in the agent. Empty state: "No skills unlocked yet."

### 6.5 `QuestRow` & `QuestBoard`

Rows take `Cron`. Status maps:

| `lastStatus` | Tone | Glyph | Label |
|---|---|---|---|
| `ok` / `success` | green | ✓ | VICTORY |
| `error` / `failed` | crimson | ✕ | FAILED |
| `running` | amber | ◌ | ACTIVE |
| `pending` | system | ◇ | READY |

Quest "rank" is derived playfully from name length to add visual diversity — gives a S-rank gold accent to long, important-looking quests. Hovering a row reveals a `▶ run` button which posts `run quest {id}` to `/command`.

### 6.6 `SystemLog` & `SystemLogLine`

Virtualization budget: keep ≤ 60 newest lines mounted (configurable). New lines animate in with the `holoIn` motif and run a single-shot **typewriter** for their first reveal — old lines render flat. Aria: `role="log"`, `aria-live="polite"`, `aria-relevant="additions"`.

Tones (`system | monarch | ok | warn | err | warm`) drive both the prefix glyph and color.

### 6.7 `VoiceOrb` *(3D hero — see `3D_HERO.md`)*

`<VoiceOrb state="idle | listening | speaking" ariseAt={timestamp} audioLevel={0..1} />`. Procedural via react-three-fiber; falls back to an animated SVG sigil when WebGL2 is missing.

### 6.8 `CommandPalette`

`⌘K`-launched, `Esc` to close, `Enter` runs the first match (or raw text). Presets are typed `Suggestion[]` with a `destructive` flag that surfaces a "DESTRUCTIVE" badge in the row and triggers `ApprovalModal` after `/command` returns `needsConfirmation: true`.

### 6.9 `ApprovalModal`

Crimson-framed alertdialog. Two buttons: **Cancel** (default focus) and **Execute** (crimson). On confirm, replays the original command with `confirm: true`.

### 6.10 `StatusWindow`

Detail-pane for the selected hunter. Renders an XL `RankBadge`, an 8-field metadata grid (id, level, model, power, routing, last-seen, sessions, elevated), HP/MP/EXP bars, the `SkillTree`, and an `IDENTITY` blurb on a rune-grid card if present.

### 6.11 `SystemNotification` (toast)

The signature Solo Leveling glide-in. `holoIn` motion, blue-corner-bracketed panel, auto-dismisses at 3.8s. Tone-keyed border + glow.

### 6.12 `PressToTalk`

Press-and-hold button + global Spacebar push-to-talk. Records via `MediaRecorder` (preferring `audio/webm; codecs=opus`); on release, posts to `/voice/command` and feeds the returned `ttsUrl` to a hidden `<audio>` element. Streams RMS audio level through `audioLevel` while recording — the `VoiceOrb` reads it for live pulse.

---

## 7. Iconography & Glyph Set

Custom glyphs are **typographic**, not SVG icons. This keeps the design system asset-free and themable via `text-shadow`.

| Glyph | Name | Use |
|---|---|---|
| `⌜⌝⌞⌟` | corner brackets | Auto-applied by `.sl-corners ::before / ::after / .corner-bl / .corner-br` |
| `⌬` | system seal | Header, notifications, console launcher |
| `✦` | monarch star | Status-window crown, voice-command logs |
| `⚔` | quest blades | Quest rows |
| `▸` | system pip | Generic log lines |
| `◌` | running ring | Quest in flight |
| `◇` | ready diamond | Quest pending |
| `⌗` | dungeon glyph | Active sessions |
| `♛` | sovereign crown | S-rank only |
| `◉` | rec dot | Press-to-talk recording |

Rune letters (E, D, C, B, A, S) are rendered in **Orbitron** with rank-hue text-shadow inside `RankBadge`. Avoid third-party icon fonts.

---

## 8. Sound Design

Optional layer; the backend's ElevenLabs TTS already handles voice. SFX cues below are *spec'd* — the audio assets aren't bundled (would bloat the build). Hooks in `App.tsx` are ready to swap in.

### 8.1 The System voice (ElevenLabs persona)

- **Voice**: female, mid-low register, slow, slightly synthesized — think the original Korean novel's "System" with subtle digital reverb.
- **Cadence**: declarative, never asking. Statements end with a clear stop.
- **Vocabulary**: "Hunter," "Quest," "Gate," "Dungeon," "Shadow," "Arise," "Dismissed," "Acknowledged," "The Monarch." Avoid colloquialisms.
- **Recommended ElevenLabs voice ID**: any voice with `stability ~0.55`, `similarity_boost ~0.75`, `style ~0.40`. Apply a light low-pass + 80ms reverb in post if possible.
- **Backend wiring**: `voice.py::synth_tts(text, dir, voice=...)` — front-end plays the returned mp3 URL via the hidden `Audio` element.

### 8.2 SFX cues (for future)

| Cue | Trigger | Suggested timbre |
|---|---|---|
| `system.appear` | new toast `holoIn` | soft sine sweep 800→1200Hz, 220ms, glassy |
| `arise` | spawn intent | low rumble (60Hz) → bright shimmer (3kHz) over 700ms |
| `rank.up` | rank promotion | rising 5-note arpeggio in C-minor → A-minor, 1.1s |
| `quest.victory` | cron `ok` | bright two-note ding (G5→C6) |
| `quest.fail`    | cron `error` | descending minor triad with mild distortion |
| `mic.start` / `mic.end` | press-to-talk | terse beeps 1200Hz / 700Hz, 60ms each |
| `gate.seal` / `gate.open` | WS close/open | metallic latch / soft hum-up |

---

## 9. Accessibility

### 9.1 Contrast

- Body text (`text-ink` on `--void`): **15.4 : 1** (WCAG AAA).
- Secondary (`text-ink-dim`): **8.1 : 1** (AAA for large, AA for small).
- Captions (`text-ink-mute`): **3.9 : 1** — used only at ≥ 11px and never as the sole carrier of meaning (always paired with a glyph or a tone-coded color).
- Quest-gold on void: **11.1 : 1** ✓.
- Monarch-violet on void: **5.6 : 1** ✓.
- Crimson on void: **5.4 : 1** ✓.

### 9.2 Motion-reduce

`@media (prefers-reduced-motion: reduce)` in `theme.css` collapses all animations to ~1ms iterations and disables the scanlines overlay. Bars still update *value* but skip the lerp tween (the new value just snaps).

### 9.3 ARIA & live regions

- `SystemLog` is `<ul role="log" aria-live="polite" aria-relevant="additions">` so screen readers announce new entries.
- `SystemNotification` is `role="status" aria-live="assertive"` for high-importance toasts.
- `ApprovalModal` is `role="alertdialog" aria-modal="true"` with the cancel button receiving initial focus.
- `RankBadge` uses `role="img" aria-label="{rank}-Rank hunter"`.
- `StatBar` uses `role="progressbar"` with `aria-valuenow / min / max`.
- `PressToTalk` uses `aria-pressed` toggled when recording.
- The mic button labels itself "Press and hold to speak" so SR users know it's a hold-button, not a toggle.

### 9.4 Focus management

`:focus-visible` on any interactive element produces a 3px halo (system blue) over a 1px void offset. Visible across all panel backgrounds. The command palette traps focus inside its dialog while open.

### 9.5 Keyboard

- `⌘K` / `Ctrl-K` — toggle palette
- `⎵ Space` (held) — push-to-talk (when not in an input)
- `Esc` — close palette, dismiss approval
- `Enter` (in palette) — submit first match

---

## 10. Tailwind ↔ CSS-vars cheatsheet

```ts
// Color
"text-system"        // hex: #4a9eff       css: var(--system)
"bg-void"            // hex: #0a0e27       css: var(--void)
"text-monarch-300"   // hex: #c298ff
"text-quest"         // hex: #ffcc00
"text-warm-300"      // hex: #eaa988
"text-danger"        // hex: #ff4a4a
"text-ok"            // hex: #5fffb0

// Glow
"shadow-glow"        // 0 0 10/24/48 cyan
"shadow-glow-monarch"
"shadow-glow-gold"

// Motion
"animate-holo-in"    // notification glide
"animate-shockwave"  // arise ring
"animate-rank-burst" // promotion burst
"animate-flicker"    // header instability

// Panels
className="sl-panel sl-corners scanlines"   // the canonical hologram
className="sl-panel sl-panel-hi sl-corners" // selected / focused
```

---

## 11. Don'ts

- **Don't** use Solo Leveling's actual logo, the "system window" UI from the show's screenshots, or any character likeness.
- **Don't** slap `shadow-glow` on every element — it loses meaning and tanks performance.
- **Don't** introduce new colors outside this token set without updating `theme.css` *and* `tailwind.config.js` together.
- **Don't** mix Inter and Fraunces in the same line — alternate by purpose, not within a sentence.
- **Don't** animate idle UI continuously beyond `pulseSystem` and `flicker` — particles, shockwaves, and bursts are reactions, not background.
