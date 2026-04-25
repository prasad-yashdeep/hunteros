/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        // ─── Void / Abyss base ─────────────────────────
        void: {
          DEFAULT: "#0a0e27",
          50: "#1c2350",
          100: "#161b3f",
          200: "#11163a",
          300: "#0d1130",
          400: "#0a0e27",
          500: "#070a1d",
          600: "#050714",
          700: "#03040b",
          800: "#020207",
          900: "#000003",
        },
        abyss: {
          DEFAULT: "#1a2454",
          400: "#1a2454",
          500: "#152045",
          600: "#101a36",
        },
        // ─── System (the iconic blue) ──────────────────
        system: {
          DEFAULT: "#4a9eff",
          50: "#eaf3ff",
          100: "#cfe3ff",
          200: "#a4cdff",
          300: "#79b6ff",
          400: "#4a9eff",
          500: "#2b86ff",
          600: "#176bdc",
          700: "#0e52ad",
          800: "#093a7c",
          900: "#062553",
        },
        // ─── Monarch (shadow violet) ───────────────────
        monarch: {
          DEFAULT: "#9b4aff",
          300: "#c298ff",
          400: "#9b4aff",
          500: "#7a2dee",
          600: "#5e1dc4",
          700: "#46139a",
        },
        // ─── Quest gold ────────────────────────────────
        quest: {
          DEFAULT: "#ffcc00",
          400: "#ffd633",
          500: "#ffcc00",
          600: "#d9ad00",
        },
        // ─── Danger crimson ────────────────────────────
        danger: {
          DEFAULT: "#ff4a4a",
          400: "#ff6868",
          500: "#ff4a4a",
          600: "#dc1f1f",
        },
        // ─── Status semantics ──────────────────────────
        ok: "#5fffb0",
        warn: "#ffb454",
        err: "#ff4a4a",
        // ─── Anthropic warm accent (terracotta / amber)
        warm: {
          DEFAULT: "#d97757",
          300: "#eaa988",
          400: "#d97757",
          500: "#bf5a3a",
          600: "#9c4429",
        },
        ember: "#f3a672",
        // ─── Rank palette ──────────────────────────────
        rank: {
          E: "#6b7393",
          D: "#7fb6e6",
          C: "#4a9eff",
          B: "#5fb7ff",
          A: "#9b4aff",
          S: "#ffcc00",
        },
        // ─── Foreground ────────────────────────────────
        ink: {
          DEFAULT: "#e8efff",
          dim: "#9fb0d4",
          mute: "#5d6e95",
          ghost: "#3a4670",
        },
      },
      fontFamily: {
        display: [
          '"Fraunces"',
          '"Playfair Display"',
          "ui-serif",
          "Georgia",
          "serif",
        ],
        sans: [
          '"Inter"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
        rune: ['"Orbitron"', '"Fraunces"', "ui-serif", "serif"],
      },
      fontSize: {
        // Display scale
        "display-2xl": ["72px", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-xl": ["56px", { lineHeight: "1.05", letterSpacing: "-0.022em" }],
        "display-lg": ["44px", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display-md": ["32px", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "display-sm": ["24px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        // Body scale
        "body-lg": ["18px", "1.55"],
        "body": ["15px", "1.55"],
        "body-sm": ["13px", "1.5"],
        "caption": ["11px", "1.4"],
        "micro": ["10px", "1.2"],
      },
      letterSpacing: {
        rune: "0.18em",
        wider2: "0.12em",
      },
      borderRadius: {
        sl: "2px",
        panel: "4px",
        card: "6px",
        pill: "999px",
      },
      boxShadow: {
        // System glow tiers
        "glow-sm": "0 0 6px rgba(74,158,255,0.45), 0 0 12px rgba(74,158,255,0.18)",
        "glow":    "0 0 10px rgba(74,158,255,0.6), 0 0 24px rgba(74,158,255,0.25), 0 0 48px rgba(74,158,255,0.12)",
        "glow-lg": "0 0 14px rgba(74,158,255,0.7), 0 0 36px rgba(74,158,255,0.35), 0 0 72px rgba(74,158,255,0.18)",
        "glow-monarch": "0 0 14px rgba(155,74,255,0.65), 0 0 36px rgba(155,74,255,0.32), 0 0 72px rgba(155,74,255,0.18)",
        "glow-gold":    "0 0 12px rgba(255,204,0,0.65), 0 0 28px rgba(255,204,0,0.3)",
        "glow-warm":    "0 0 14px rgba(217,119,87,0.55), 0 0 32px rgba(217,119,87,0.22)",
        "glow-danger":  "0 0 12px rgba(255,74,74,0.7), 0 0 28px rgba(255,74,74,0.3)",
        "panel":   "inset 0 0 0 1px rgba(74,158,255,0.35), 0 0 0 1px rgba(74,158,255,0.05), 0 16px 40px rgba(0,0,0,0.55)",
        "panel-hi":"inset 0 0 0 1px rgba(74,158,255,0.65), 0 0 24px rgba(74,158,255,0.25), 0 16px 40px rgba(0,0,0,0.55)",
      },
      backdropBlur: {
        sl: "10px",
      },
      backgroundImage: {
        "void-radial":
          "radial-gradient(ellipse at 50% 0%, rgba(74,158,255,0.12) 0%, rgba(10,14,39,0) 60%), radial-gradient(ellipse at 50% 100%, rgba(155,74,255,0.10) 0%, rgba(10,14,39,0) 60%), linear-gradient(180deg, #0a0e27 0%, #070a1d 100%)",
        "panel-grad":
          "linear-gradient(180deg, rgba(26,36,84,0.55) 0%, rgba(10,14,39,0.65) 100%)",
        "panel-grad-hi":
          "linear-gradient(180deg, rgba(74,158,255,0.18) 0%, rgba(26,36,84,0.55) 40%, rgba(10,14,39,0.7) 100%)",
        "scanlines":
          "repeating-linear-gradient(0deg, rgba(74,158,255,0.06) 0px, rgba(74,158,255,0.06) 1px, transparent 1px, transparent 3px)",
        "rune-grid":
          "linear-gradient(rgba(74,158,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,255,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        // Slow holographic pulse
        pulseSystem: {
          "0%, 100%": {
            boxShadow:
              "0 0 6px rgba(74,158,255,0.4), 0 0 14px rgba(74,158,255,0.18)",
          },
          "50%": {
            boxShadow:
              "0 0 14px rgba(74,158,255,0.75), 0 0 36px rgba(74,158,255,0.32)",
          },
        },
        // Particle flicker for runes
        flicker: {
          "0%, 100%": { opacity: "1" },
          "47%": { opacity: "0.86" },
          "48%": { opacity: "0.4" },
          "49%": { opacity: "0.92" },
          "50%": { opacity: "0.5" },
          "51%": { opacity: "1" },
        },
        // Typewriter cursor blink
        caret: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        // The "Arise" shockwave
        shockwave: {
          "0%": { transform: "scale(0.2)", opacity: "0.95" },
          "70%": { opacity: "0.45" },
          "100%": { transform: "scale(3)", opacity: "0" },
        },
        // Vertical column of light from beneath
        ariseColumn: {
          "0%": { transform: "scaleY(0)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "scaleY(1)", opacity: "0.9" },
        },
        // Rank-up violet burst
        rankBurst: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "30%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        // Hologram entry — the classic Solo Leveling notification glide
        holoIn: {
          "0%":   { transform: "translateY(-12px) scaleY(0.6)", opacity: "0", filter: "blur(6px)" },
          "60%":  { transform: "translateY(2px) scaleY(1.04)",  opacity: "1", filter: "blur(0px)" },
          "100%": { transform: "translateY(0) scaleY(1)",       opacity: "1", filter: "blur(0px)" },
        },
        holoOut: {
          "0%":   { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-6px) scaleY(0.92)", filter: "blur(4px)" },
        },
        // Drifting scanlines on panels
        scan: {
          "0%":   { backgroundPositionY: "0px" },
          "100%": { backgroundPositionY: "120px" },
        },
        // Slow orbital float
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        // HP/MP bar shimmer when topped up
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // Loading bar indeterminate
        runeMarch: {
          "0%":   { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "pulse-system": "pulseSystem 2.6s ease-in-out infinite",
        flicker:        "flicker 4.2s steps(2,end) infinite",
        caret:          "caret 1s step-end infinite",
        shockwave:      "shockwave 1100ms cubic-bezier(0.16,1,0.3,1) forwards",
        "arise-column": "ariseColumn 900ms cubic-bezier(0.16,1,0.3,1) forwards",
        "rank-burst":   "rankBurst 900ms cubic-bezier(0.16,1,0.3,1) forwards",
        "holo-in":      "holoIn 360ms cubic-bezier(0.16,1,0.3,1) forwards",
        "holo-out":     "holoOut 240ms cubic-bezier(0.4,0,1,1) forwards",
        scan:           "scan 8s linear infinite",
        float:          "float 6s ease-in-out infinite",
        shimmer:        "shimmer 3.4s linear infinite",
        "rune-march":   "runeMarch 2.4s linear infinite",
      },
      transitionTimingFunction: {
        "out-monarch": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
