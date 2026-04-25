import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
  Audio,
  staticFile,
  Sequence,
} from "remotion";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  void: "#0a0e27",
  blue: "#4a9eff",
  violet: "#9b4aff",
  gold: "#d4a24a",
  danger: "#ff4a4a",
  green: "#5fffb0",
  ink: "#e8f0ff",
  mute: "#a8b0c8",
};

// ─── Utility ─────────────────────────────────────────────────────────────────
const ease = (x: number) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function fadeIn(frame: number, start: number, dur: number) {
  return clamp((frame - start) / dur, 0, 1);
}

// ─── Scanline Overlay ─────────────────────────────────────────────────────────
const Scanlines: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)",
      pointerEvents: "none",
      zIndex: 100,
    }}
  />
);

// ─── Corner Brackets ─────────────────────────────────────────────────────────
const Brackets: React.FC<{ color?: string; size?: number; thickness?: number }> = ({
  color = C.blue,
  size = 24,
  thickness = 2,
}) => {
  const s = { position: "absolute" as const, width: size, height: size };
  const line = { background: color };
  return (
    <>
      {/* TL */}
      <div style={{ ...s, top: 0, left: 0 }}>
        <div style={{ ...line, position: "absolute", top: 0, left: 0, width: size, height: thickness }} />
        <div style={{ ...line, position: "absolute", top: 0, left: 0, width: thickness, height: size }} />
      </div>
      {/* TR */}
      <div style={{ ...s, top: 0, right: 0 }}>
        <div style={{ ...line, position: "absolute", top: 0, right: 0, width: size, height: thickness }} />
        <div style={{ ...line, position: "absolute", top: 0, right: 0, width: thickness, height: size }} />
      </div>
      {/* BL */}
      <div style={{ ...s, bottom: 0, left: 0 }}>
        <div style={{ ...line, position: "absolute", bottom: 0, left: 0, width: size, height: thickness }} />
        <div style={{ ...line, position: "absolute", bottom: 0, left: 0, width: thickness, height: size }} />
      </div>
      {/* BR */}
      <div style={{ ...s, bottom: 0, right: 0 }}>
        <div style={{ ...line, position: "absolute", bottom: 0, right: 0, width: size, height: thickness }} />
        <div style={{ ...line, position: "absolute", bottom: 0, right: 0, width: thickness, height: size }} />
      </div>
    </>
  );
};

// ─── Scene 1: Black Void → System Glyph ──────────────────────────────────────
// 0–90 frames (0–3s)
export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();

  const glyphOpacity = fadeIn(frame, 10, 40);
  const glyphScale = interpolate(frame, [10, 50], [0.5, 1], { extrapolateRight: "clamp" });
  const glowSize = interpolate(frame, [10, 80], [0, 80], { extrapolateRight: "clamp" });

  const gridOpacity = fadeIn(frame, 20, 50);
  const titleOpacity = fadeIn(frame, 50, 30);
  const tagOpacity = fadeIn(frame, 65, 20);

  // Scanline sweep effect
  const sweepY = interpolate(frame, [5, 60], [-100, 1180], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.void, overflow: "hidden" }}>
      {/* Grid rune pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: gridOpacity * 0.15,
          backgroundImage: `linear-gradient(${C.blue} 1px, transparent 1px), linear-gradient(90deg, ${C.blue} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Scanline sweep */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: sweepY,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${C.blue}, ${C.blue}, transparent)`,
          opacity: 0.7,
          boxShadow: `0 0 20px ${C.blue}`,
        }}
      />

      {/* Rune particles */}
      {["ᚠ", "ᚨ", "ᚱ", "ᛚ", "ᚷ", "ᛏ"].map((r, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${10 + i * 14}%`,
            top: `${20 + (i % 2) * 40}%`,
            color: C.blue,
            fontFamily: "monospace",
            fontSize: 32,
            opacity: gridOpacity * (0.3 + (i * 0.1)),
            textShadow: `0 0 12px ${C.blue}`,
          }}
        >
          {r}
        </div>
      ))}

      {/* Center glyph ⌬ */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -60%) scale(${glyphScale})`,
          opacity: glyphOpacity,
          fontSize: 200,
          color: C.blue,
          textShadow: `0 0 ${glowSize}px ${C.blue}, 0 0 ${glowSize * 2}px ${C.blue}80`,
          lineHeight: 1,
          fontWeight: 100,
        }}
      >
        ⌬
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 96,
            color: C.ink,
            letterSpacing: 16,
            textTransform: "uppercase",
            textShadow: `0 0 40px ${C.blue}`,
          }}
        >
          HunterOS
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          bottom: "22%",
          width: "100%",
          textAlign: "center",
          opacity: tagOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 28,
            color: C.mute,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          THE SYSTEM FOR YOUR AI FLEET
        </div>
      </div>

      <Brackets color={C.blue} size={40} thickness={2} />
      <Scanlines />
    </AbsoluteFill>
  );
};

// ─── Scene 2: "Arise." Title Card ─────────────────────────────────────────────
// 90–210 frames (3–7s)
export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  // Typewriter effect: "Arise." — 6 chars, one per 8 frames starting at frame 10
  const fullText = "Arise.";
  const charsVisible = Math.floor(clamp((frame - 10) / 8, 0, fullText.length));
  const displayText = fullText.slice(0, charsVisible);

  // Glow pulse (sinusoidal after text is done)
  const textDone = frame > 10 + fullText.length * 8;
  const pulse = textDone ? Math.sin(frame * 0.15) * 0.5 + 0.5 : 0;

  const glowA = interpolate(pulse, [0, 1], [20, 80]);
  const glowB = interpolate(pulse, [0, 1], [40, 120]);

  const bgOpacity = fadeIn(frame, 0, 20);
  const subOpacity = fadeIn(frame, 60, 20);

  return (
    <AbsoluteFill
      style={{
        background: C.void,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity: bgOpacity,
      }}
    >
      {/* BG grid subtle */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage: `linear-gradient(${C.violet} 1px, transparent 1px), linear-gradient(90deg, ${C.violet} 1px, transparent 1px)`,
          backgroundSize: "120px 120px",
        }}
      />

      {/* Radial glow behind text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${C.violet}40 0%, transparent 70%)`,
          filter: `blur(${20 + pulse * 30}px)`,
        }}
      />

      {/* Main text */}
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 180,
          color: C.violet,
          letterSpacing: 8,
          textShadow: `0 0 ${glowA}px ${C.violet}, 0 0 ${glowB}px ${C.violet}80`,
          minHeight: 220,
          display: "flex",
          alignItems: "center",
        }}
      >
        {displayText}
        {charsVisible < fullText.length && (
          <span style={{ opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0 }}>|</span>
        )}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 24,
          color: C.mute,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: subOpacity,
          marginTop: 20,
        }}
      >
        ⌬ SYSTEM ONLINE ⌬ NINE HUNTERS REGISTERED ⌬
      </div>

      <Brackets color={C.violet} size={50} thickness={2} />
      <Scanlines />
    </AbsoluteFill>
  );
};

// ─── Hunter Card Component ─────────────────────────────────────────────────────
interface HunterCardProps {
  name: string;
  rank: string;
  level?: number;
  cls?: string;
  delay: number;
}

const HunterCard: React.FC<HunterCardProps> = ({ name, rank, level, cls, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 100, mass: 1 },
    from: 0,
    to: 1,
  });

  const rankColor = rank === "S" ? C.violet : rank === "B" ? C.blue : C.mute;
  const translateY = interpolate(slideProgress, [0, 1], [120, 0]);
  const opacity = interpolate(slideProgress, [0, 0.2], [0, 1]);

  return (
    <div
      style={{
        width: 280,
        background: `linear-gradient(135deg, #0d1235, #0a0e27)`,
        border: `1px solid ${C.blue}60`,
        borderRadius: 4,
        padding: "16px 20px",
        position: "relative",
        transform: `translateY(${translateY}px)`,
        opacity,
        boxShadow: `0 0 20px ${rankColor}40, inset 0 0 30px ${rankColor}10`,
      }}
    >
      {/* Scanline overlay inside card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)",
          borderRadius: 4,
          pointerEvents: "none",
        }}
      />

      <Brackets color={rankColor} size={12} thickness={1} />

      {/* Rank badge */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 16,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 28,
          fontWeight: "bold",
          color: rankColor,
          textShadow: `0 0 10px ${rankColor}`,
          letterSpacing: 2,
        }}
      >
        {rank}
      </div>

      {/* Top bracket label */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: C.blue,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        ⌜ HUNTER ⌝
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 18,
          color: C.ink,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: "bold",
          marginBottom: 8,
        }}
      >
        {name}
      </div>

      {/* Class + level */}
      {cls && (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: C.mute,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {cls} {level !== undefined ? `· LV ${level}` : ""}
        </div>
      )}

      {/* HP/MP bars (only for main card) */}
      {level !== undefined && (
        <div style={{ marginTop: 8 }}>
          {[
            { label: "HP", color: C.danger, val: 0.87 },
            { label: "MP", color: C.blue, val: 0.72 },
          ].map(({ label, color, val }) => (
            <div key={label} style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: C.mute,
                  letterSpacing: 2,
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  height: 4,
                  background: "#ffffff15",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${val * 100}%`,
                    height: "100%",
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom bracket */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: `${C.blue}80`,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginTop: 10,
        }}
      >
        ⌞ ACTIVE ⌟
      </div>
    </div>
  );
};

// ─── Scene 3: Hunter Card Cascade ─────────────────────────────────────────────
// 210–390 frames (7–13s)
export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = fadeIn(frame, 0, 20);

  const hunters = [
    { name: "CLAW THE BUILDER", rank: "S", level: 47, cls: "ARCHITECT", delay: 5 },
    { name: "CINDERELLA", rank: "S", delay: 15 },
    { name: "JOBHUNT", rank: "B", delay: 25 },
    { name: "CIN-BACKEND", rank: "B", delay: 35 },
    { name: "CIN-FRONTEND", rank: "C", delay: 45 },
    { name: "CIN-IOS", rank: "B", delay: 55 },
  ];

  return (
    <AbsoluteFill style={{ background: C.void, padding: "60px 80px" }}>
      {/* BG grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage: `linear-gradient(${C.blue} 1px, transparent 1px), linear-gradient(90deg, ${C.blue} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <Brackets color={C.blue} size={50} thickness={2} />

      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 50,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: C.blue,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          ⌜ REGISTERED HUNTERS ⌝
        </div>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 48,
            color: C.ink,
            letterSpacing: 4,
            marginTop: 8,
            textShadow: `0 0 30px ${C.blue}60`,
          }}
        >
          Your AI Fleet
        </div>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          justifyContent: "center",
        }}
      >
        {hunters.map((h, i) => (
          <HunterCard key={i} {...h} />
        ))}
      </div>

      <Scanlines />
    </AbsoluteFill>
  );
};

// ─── Scene 4: Monarch Sigil ───────────────────────────────────────────────────
// 390–540 frames (13–18s)
export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introScale = spring({ frame, fps, config: { damping: 14, stiffness: 80 }, from: 0.5, to: 1 });
  const pulse = Math.sin(frame * 0.12) * 0.5 + 0.5;
  const orbSize = 220 + pulse * 30;
  const glowR = 80 + pulse * 60;

  // Waveform bars
  const barCount = 20;
  const waveformOpacity = fadeIn(frame, 30, 20);

  const textOpacity = fadeIn(frame, 40, 25);

  // Ray rotation
  const rayAngle = frame * 0.5;

  return (
    <AbsoluteFill
      style={{
        background: C.void,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          backgroundImage: `linear-gradient(${C.violet} 1px, transparent 1px), linear-gradient(90deg, ${C.violet} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <Brackets color={C.violet} size={50} thickness={2} />

      {/* Label top */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          color: C.blue,
          letterSpacing: 8,
          textTransform: "uppercase",
          marginBottom: 40,
          opacity: textOpacity,
        }}
      >
        ⌜ MONARCH SIGIL ⌝
      </div>

      {/* Radial rays SVG */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${rayAngle}deg)`,
          width: 600,
          height: 600,
          opacity: 0.4 + pulse * 0.3,
        }}
      >
        <svg width="600" height="600" viewBox="0 0 600 600">
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const x1 = 300 + Math.cos(angle) * 120;
            const y1 = 300 + Math.sin(angle) * 120;
            const x2 = 300 + Math.cos(angle) * 290;
            const y2 = 300 + Math.sin(angle) * 290;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 2 === 0 ? C.blue : C.violet}
                strokeWidth={i % 4 === 0 ? 2 : 1}
                opacity={0.6}
              />
            );
          })}
          {/* Concentric rings */}
          {[80, 120, 160, 200].map((r, i) => (
            <circle
              key={i}
              cx="300"
              cy="300"
              r={r}
              fill="none"
              stroke={i % 2 === 0 ? C.blue : C.violet}
              strokeWidth={1}
              opacity={0.3}
            />
          ))}
        </svg>
      </div>

      {/* Orb */}
      <div
        style={{
          width: orbSize,
          height: orbSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, #ffffff20 0%, ${C.blue}60 30%, ${C.violet}40 60%, transparent 80%)`,
          boxShadow: `0 0 ${glowR}px ${C.blue}80, 0 0 ${glowR * 2}px ${C.violet}40`,
          transform: `scale(${introScale})`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 80,
            color: "#ffffff",
            textShadow: `0 0 30px ${C.blue}`,
            opacity: 0.9,
          }}
        >
          ⌬
        </div>
      </div>

      {/* Waveform */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginTop: 30,
          opacity: waveformOpacity,
        }}
      >
        {Array.from({ length: barCount }).map((_, i) => {
          const h = 8 + Math.sin(frame * 0.2 + i * 0.7) * 16 + 10;
          return (
            <div
              key={i}
              style={{
                width: 6,
                height: h,
                background: C.blue,
                borderRadius: 3,
                boxShadow: `0 0 6px ${C.blue}`,
              }}
            />
          );
        })}
      </div>

      {/* Feature text */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22,
          color: C.mute,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginTop: 30,
          opacity: textOpacity,
          textAlign: "center",
        }}
      >
        PRESS-TO-TALK · WHISPER STT · ELEVENLABS TTS
      </div>

      <Scanlines />
    </AbsoluteFill>
  );
};

// ─── Scene 5: Quest Board ─────────────────────────────────────────────────────
// 540–690 frames (18–23s)
const quests = [
  { name: "DAILY DIGEST", status: "ok", timing: "06:00 UTC", tag: "CRON" },
  { name: "RESUME OPTIMIZER", status: "ok", timing: "ON DEMAND", tag: "TASK" },
  { name: "LINKEDIN JOBS SCANNER", status: "warn", timing: "EVERY 4H", tag: "CRON" },
  { name: "LEAD-TO-APPLICATION BRIDGE", status: "ok", timing: "EVERY 6H", tag: "CRON" },
  { name: "HEALTH CHECK", status: "ok", timing: "EVERY 1H", tag: "CRON" },
];

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = fadeIn(frame, 0, 20);

  return (
    <AbsoluteFill style={{ background: C.void, padding: "60px 160px" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.07,
          backgroundImage: `linear-gradient(${C.gold} 1px, transparent 1px), linear-gradient(90deg, ${C.gold} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <Brackets color={C.gold} size={50} thickness={2} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 50, opacity: titleOpacity }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: C.gold,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          ⌜ QUEST BOARD ⌝
        </div>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 48,
            color: C.ink,
            letterSpacing: 4,
            marginTop: 8,
            textShadow: `0 0 30px ${C.gold}60`,
          }}
        >
          Active Missions
        </div>
      </div>

      {/* Quest rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {quests.map((q, i) => {
          const rowOpacity = fadeIn(frame, 10 + i * 18, 20);
          const rowSlide = interpolate(frame - (10 + i * 18), [0, 25], [40, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "16px 24px",
                background: `linear-gradient(90deg, #0d1235, #0a0e27)`,
                border: `1px solid ${C.gold}40`,
                borderRadius: 4,
                opacity: rowOpacity,
                transform: `translateX(${rowSlide}px)`,
                position: "relative",
              }}
            >
              {/* Status dot */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: q.status === "ok" ? C.green : C.gold,
                  boxShadow: `0 0 10px ${q.status === "ok" ? C.green : C.gold}`,
                  flexShrink: 0,
                }}
              />

              {/* Quest name */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 20,
                  color: C.ink,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  flex: 1,
                }}
              >
                {q.name}
              </div>

              {/* Tag */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: C.gold,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  border: `1px solid ${C.gold}60`,
                  padding: "3px 8px",
                  borderRadius: 2,
                }}
              >
                {q.tag}
              </div>

              {/* Timing */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: C.mute,
                  letterSpacing: 2,
                  minWidth: 120,
                  textAlign: "right",
                }}
              >
                {q.timing}
              </div>
            </div>
          );
        })}
      </div>

      <Scanlines />
    </AbsoluteFill>
  );
};

// ─── Scene 6: Final Shot ──────────────────────────────────────────────────────
// 690–840 frames (23–28s)
export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shockwave radial burst
  const burstScale = spring({ frame, fps, config: { damping: 8, stiffness: 60 }, from: 0, to: 1 });
  const burstOpacity = interpolate(frame, [0, 5, 60, 100], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  const ariseOpacity = fadeIn(frame, 20, 30);
  const ariseScale = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 80 }, from: 0.7, to: 1 });

  const logoOpacity = fadeIn(frame, 70, 30);
  const urlOpacity = fadeIn(frame, 90, 30);

  const pulse = Math.sin(frame * 0.1) * 0.5 + 0.5;

  return (
    <AbsoluteFill
      style={{
        background: C.void,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Shockwave rings */}
      {[1, 1.4, 1.8].map((mult, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 800 * burstScale * mult,
            height: 800 * burstScale * mult,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: `2px solid ${i % 2 === 0 ? C.violet : C.blue}`,
            opacity: burstOpacity * (1 - i * 0.2),
            boxShadow: `0 0 30px ${C.violet}`,
          }}
        />
      ))}

      {/* Radial burst SVG */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${burstScale})`,
          opacity: burstOpacity * 0.5,
          width: 1000,
          height: 1000,
        }}
      >
        <svg width="1000" height="1000" viewBox="0 0 1000 1000">
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const x1 = 500 + Math.cos(angle) * 50;
            const y1 = 500 + Math.sin(angle) * 50;
            const x2 = 500 + Math.cos(angle) * 480;
            const y2 = 500 + Math.sin(angle) * 480;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 3 === 0 ? C.violet : C.blue}
                strokeWidth={i % 6 === 0 ? 3 : 1}
                opacity={0.8}
              />
            );
          })}
        </svg>
      </div>

      {/* "Arise." */}
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 160,
          color: C.violet,
          textShadow: `0 0 ${60 + pulse * 40}px ${C.violet}, 0 0 120px ${C.blue}60`,
          opacity: ariseOpacity,
          transform: `scale(${ariseScale})`,
          letterSpacing: 8,
          position: "relative",
          zIndex: 10,
        }}
      >
        Arise.
      </div>

      {/* Logo lockup */}
      <div
        style={{
          marginTop: 40,
          textAlign: "center",
          opacity: logoOpacity,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 48,
            color: C.ink,
            letterSpacing: 8,
            textTransform: "uppercase",
            textShadow: `0 0 20px ${C.blue}`,
          }}
        >
          HUNTEROS v0.1
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          marginTop: 16,
          opacity: urlOpacity,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            color: C.blue,
            letterSpacing: 4,
          }}
        >
          github.com/prasad-yashdeep/hunteros
        </div>
      </div>

      <Brackets color={C.violet} size={60} thickness={3} />
      <Scanlines />
    </AbsoluteFill>
  );
};

// ─── Master Composition ───────────────────────────────────────────────────────
export const HunterOSDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.void }}>
      {/* Audio at scene 2 (frame 90) */}
      <Sequence from={90}>
        <Audio src={staticFile("arise.mp3")} volume={1} />
      </Sequence>

      {/* Scene 1: 0–90 */}
      <Sequence from={0} durationInFrames={90}>
        <Scene1 />
      </Sequence>

      {/* Scene 2: 90–210 */}
      <Sequence from={90} durationInFrames={120}>
        <Scene2 />
      </Sequence>

      {/* Scene 3: 210–390 */}
      <Sequence from={210} durationInFrames={180}>
        <Scene3 />
      </Sequence>

      {/* Scene 4: 390–540 */}
      <Sequence from={390} durationInFrames={150}>
        <Scene4 />
      </Sequence>

      {/* Scene 5: 540–690 */}
      <Sequence from={540} durationInFrames={150}>
        <Scene5 />
      </Sequence>

      {/* Scene 6: 690–840 */}
      <Sequence from={690} durationInFrames={150}>
        <Scene6 />
      </Sequence>
    </AbsoluteFill>
  );
};
