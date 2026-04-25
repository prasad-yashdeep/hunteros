# HunterOS — 3D Hero Spec

> **The Monarch Sigil.** A translucent blue core, a fresnel halo, three runic rings, and an orbiting cloud of shadow soldiers. It listens. It speaks. It reacts.

This document describes the centerpiece 3D element rendered by `frontend/src/components/VoiceOrb.tsx`.

---

## 1. Concept

We considered four candidates:

| Concept | Why we passed |
|---|---|
| **Throne orb** (Sung Jinwoo's seat) | Too literal / trademark-adjacent |
| **Quest gate portal** | Compelling, but the metaphor doesn't extend to voice/state |
| **Shadow army stand-up** | Beautiful for "Arise" — but visually busy at idle |
| ✅ **Monarch Sigil** | A focused, geometric *seal* with multiple animated layers. Idles calmly, blooms loudly. Maps cleanly to `idle/listening/speaking/arise` states. |

The sigil reads as the user's **link to the System** — it pulses to your voice, flares when you summon, and drifts otherwise.

### Why it works

- **Centered, vertically anchored.** Mirrors the way Solo Leveling's notifications float in front of the protagonist — the sigil is the *source* of those notifications.
- **State-rich.** Four channels (idle intensity, audio level, arise impulse, rank impulse) feed continuously into shaders without retriggers — feels alive, not animated.
- **Procedural.** Every vertex is generated at construction time. No glTF, no textures, no IP risk.

---

## 2. Implementation Outline

Built with **`@react-three/fiber`** + **`three`** + **`@react-three/drei`**. All inline in `VoiceOrb.tsx`. Total ~ 410 lines including shaders.

### 2.1 Component tree

```
<VoiceOrb state ariseAt audioLevel>
  ├─ <halo: CSS radial-gradient div behind canvas>
  ├─ <Canvas dpr=[1,1.6] camera fov=36>
  │    ├─ <color args={["#06091a"]}>           (background)
  │    ├─ <fog args={["#06091a", 4.5, 9]}>
  │    ├─ <ambientLight intensity=0.4>
  │    ├─ <pointLight color=#4a9eff … >        (key, system blue)
  │    ├─ <pointLight color=#9b4aff … >        (rim, monarch)
  │    ├─ <CoreOrb intensity ariseAt>          ← Icosa + custom shader
  │    ├─ <FresnelShell intensity>             ← Sphere backside + fresnel
  │    ├─ <RuneRings>                          ← 3 toruses + radial ticks
  │    ├─ <ShadowParticles ariseAt count=320>  ← Points cloud
  │    └─ <AriseColumn ariseAt>                ← Billboard pillar
  ├─ <css shockwave ring on arise>
  └─ <SVG fallback if !webgl2>
```

### 2.2 `CoreOrb` — the breathing center

- **Geometry**: `IcosahedronGeometry(1.0, 6)` → ~2.5k tris. Subdivided enough for smooth noise displacement.
- **Material**: custom `ShaderMaterial`, transparent, depth-write off.
- **Vertex shader**: displaces each vertex along its normal by 3D simplex noise. Two octaves, second one at 3× freq with smaller amplitude, animated by `uTime`. Total disp scales with `uIntensity` (state) and `uArise` (impulse).
- **Fragment shader**: blue→violet vertical gradient (`mix(uColorA, uColorB, smoothstep(-0.6, 0.6, vPos.y))`), plus fresnel rim (`pow(1-dot(N,V), 2.5)`), plus a thin sinusoidal "scan band" (`bands = 0.18 * (0.5 + 0.5 sin(vPos.y * 18 + uTime * 1.2))`). Hot-shifts toward gold during arise.
- **Animation**: orbit rotates `y` at 0.18 rad/s, subtle wobble on `x`.

```glsl
float disp = (snoise(p * 1.4 + …) * 0.10
            + snoise(p * 3.0 - …) * 0.045)
           * (0.6 + uIntensity * 0.7 + uArise * 1.2);
p += normal * disp;
```

### 2.3 `FresnelShell` — the holographic outer glow

- **Geometry**: `SphereGeometry(1, 64, 64)` scaled to `1.32`.
- **Material**: `ShaderMaterial` rendered as `BackSide` with additive blending; fragment outputs `vec3(0.475, 0.71, 1.0)` (system-300) attenuated by fresnel × pulse × intensity.
- **Effect**: gives the core a soft cyan halo that breathes (`uTime * 1.6` sin). When the user speaks loudly, opacity climbs.

### 2.4 `RuneRings` — the orbiting frame

- Three `TorusGeometry(1.7, 0.012, 8, 160)` — XY, XZ, YZ planes — colored cyan / violet / cyan.
- One `BufferGeometry` of 24 radial line segments (ticks) at radii 1.78–1.92.
- Whole group rotates `y` at 0.25 rad/s with damped `x/z` wobble.

These read as the **sigil's geometry frame** — same role as the corner brackets do in 2D panels.

### 2.5 `ShadowParticles` — the orbiting soldiers

- 320 points distributed on a sphere (uniform via inverse CDF on `cos(phi)`), radius 2.0–2.55. `aSeed` per point gives independent wobble.
- Custom shader sizes points by `uPxSize * (260 / vDist)` for view-space scaling. Color blends cyan→gold during arise.
- On **arise**: each particle is pushed outward by `normalize(p) * uArise * (0.6 + aSeed * 0.9)` — they shoot outward then settle. The whole cloud rotates slowly around `y`.
- Additive blending creates the "shadow soldier glimmer" feel without ever resolving a face — they read as luminous fragments, not models.

### 2.6 `AriseColumn` — the vertical pillar

- A `PlaneGeometry(1.4, 6)` that always `lookAt(camera)` (manual billboarding — no need for drei `<Billboard>`).
- Fragment is a horizontal hat × vertical fade × `uArise` × subtle flicker. Lights up only during the arise impulse window (1.4s).

This is the column-of-light from the show's "Arise!" — but volumetric and view-aligned.

---

## 3. Procedural Asset Strategy

| Asset | Generation | Notes |
|---|---|---|
| Core orb mesh | `IcosahedronGeometry(1, 6)` | runtime |
| Outer shell | `SphereGeometry(1, 64, 64)` | runtime |
| Rings (×3) | `TorusGeometry(1.7, 0.012, 8, 160)` | runtime |
| Tick segments | Hand-built `BufferGeometry` (48 verts) | runtime |
| Particle positions | `Float32Array` filled in `useMemo` | runtime |
| Noise | Inline simplex (Ashima — public domain MIT) | shader-time |
| Background haze | CSS `radial-gradient` div behind canvas | CSS |
| Fallback sigil | Hand-coded inline SVG | static |

Zero external models. Zero textures. The only network deps are Google Fonts.

---

## 4. Performance Budget

**Target**: 60 fps on Apple silicon (M1+) at 1440×900, ≤ 5 ms GPU per frame, ≤ 2 ms CPU per frame.

| Item | Cost |
|---|---|
| Core icosa (~2.5k tris) + 64-segment shell sphere (~8k tris) | < 1 ms |
| Three 8×160 toruses + 48 tick lines | < 0.3 ms |
| 320-point particle cloud (additive) | < 0.6 ms |
| `dpr` capped at 1.6 (configured on `<Canvas dpr={[1, 1.6]}>`) | — |
| Total draw calls | ~7 |

Notes:
- We picked icosa-6 (not 7) and 320 particles (not 1024) explicitly to keep the scene cheap on integrated GPUs.
- Power preference is `"high-performance"`. `antialias: true` is fine at this geometry budget.
- No post-processing pipeline — the fresnel shell and additive particles supply most of the "bloomy" feel without needing UnrealBloom.
- Shaders use only `mediump` precision implicitly — no `highp` declarations.
- All `useMemo`/`useFrame` dependencies stable; no per-frame allocations.

### Fallback path

`detectWebGL2()` runs once on mount. If absent, `<FallbackSigil />` renders a hand-coded **SVG sigil** (orb gradient + 3 ellipses + monarch lozenge + animated CSS `shockwave` on arise). Costs nothing GPU-wise. Visually still on-brand — same colors, same "rings around an orb" silhouette.

---

## 5. Interaction & State Reactions

### 5.1 Idle (`state="idle"`, no audio, no arise)

- Core wobbles softly (low `uIntensity ≈ 0.18`).
- Fresnel breathes at 1.6 Hz — pulse covers ~60% of visible area at peak.
- Rings rotate at constant 0.25 rad/s; particles drift.
- Reads as "the sigil is alive, you don't need to do anything."

### 5.2 Listening (`state="listening"`, mic open)

- `uIntensity` rises to 0.55 baseline.
- `audioLevel` (RMS from `PressToTalk`) is `max`'d with the baseline — the orb visibly pulses to your voice. Silent → still 0.55 baseline; shouting → near 1.0 with strong displacement.
- Fresnel opacity climbs.
- This is the most direct user-feedback channel — you *see* the system hearing you.

### 5.3 Speaking (`state="speaking"`, TTS playing)

- `uIntensity` rises to 0.9. Fresnel and core both saturate.
- (Future hook: tie to TTS audio's RMS via `AnalyserNode` for true lipsync — not wired today.)
- When the `<Audio>` `onended` fires, state transitions back to idle.

### 5.4 Arise (`ariseAt = Date.now()` set)

- `uArise` jumps to `1` and decays linearly over **1.4 s**.
- `CoreOrb` color hot-shifts toward gold; vertex displacement spikes.
- `ShadowParticles` shoot outward then settle.
- `AriseColumn` lights up vertically.
- A CSS shockwave ring expands over the canvas (`animate-shockwave`).
- A `system.notify` toast lands above the canvas.
- Concurrently, the global `SystemLog` records the spawn.

Rank-up uses a similar but card-local burst — it does **not** retrigger the orb (would be too noisy for a passive event).

---

## 6. API surface

```tsx
<VoiceOrb
  state={"idle" | "listening" | "speaking"}     // discrete
  ariseAt={number}                              // Date.now() when fired
  audioLevel={number}                           // 0..1 RMS, optional
  className={string}
/>
```

Driven from the global `useStore`:
- `state` ← derived from `voiceState` in `App.tsx` (`listening` while recording, `speaking` while TTS plays).
- `ariseAt` ← `useStore(s => s.ariseAt)` — fires whenever the user runs a `spawn` intent.
- `audioLevel` ← `setAudioLevel` in `App.tsx`, fed by `PressToTalk.onLevel`.

---

## 7. Future extensions (out of scope today)

- **TTS lipsync**: pipe ElevenLabs playback through `AnalyserNode` and feed RMS into `audioLevel`.
- **Per-rank palette**: tint the orb subtly when the user has selected a hunter card (e.g. monarch-violet shell while inspecting an A-rank).
- **Shadow soldier "stand-up" sequence**: on a specific intent ("show me my army"), reorganize particles into vertical lines like the army standing in formation. ~50 lines of GLSL.
- **WebGPU path**: identical scene under `@react-three/fiber`'s `gpu` mode if browsers catch up.
