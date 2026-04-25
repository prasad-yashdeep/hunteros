import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { clamp } from "../lib/format";

interface Props {
  value: number;     // 0-100
  max?: number;      // default 100
  label?: string;    // e.g. "HP" or "MP"
  variant?: "hp" | "mp" | "xp" | "danger" | "warm";
  showNumber?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
  /** Lerp toward `value` over `lerpMs` */
  lerpMs?: number;
}

const VARIANT_GRAD: Record<NonNullable<Props["variant"]>, string> = {
  hp:     "linear-gradient(90deg, #2b86ff 0%, #79b6ff 50%, #cfe3ff 100%)",
  mp:     "linear-gradient(90deg, #5e1dc4 0%, #9b4aff 50%, #c298ff 100%)",
  xp:     "linear-gradient(90deg, #d9ad00 0%, #ffcc00 60%, #fff099 100%)",
  danger: "linear-gradient(90deg, #9c1f1f 0%, #ff4a4a 50%, #ffa3a3 100%)",
  warm:   "linear-gradient(90deg, #9c4429 0%, #d97757 50%, #f3a672 100%)",
};

const VARIANT_GLOW: Record<NonNullable<Props["variant"]>, string> = {
  hp:     "0 0 6px rgba(74,158,255,0.55), 0 0 14px rgba(74,158,255,0.25)",
  mp:     "0 0 6px rgba(155,74,255,0.55), 0 0 14px rgba(155,74,255,0.25)",
  xp:     "0 0 6px rgba(255,204,0,0.6), 0 0 14px rgba(255,204,0,0.3)",
  danger: "0 0 6px rgba(255,74,74,0.6), 0 0 14px rgba(255,74,74,0.3)",
  warm:   "0 0 6px rgba(217,119,87,0.55), 0 0 14px rgba(217,119,87,0.25)",
};

const SIZES = {
  xs: { h: 4, font: 10 },
  sm: { h: 6, font: 11 },
  md: { h: 10, font: 12 },
};

export function StatBar({
  value,
  max = 100,
  label,
  variant = "hp",
  showNumber = true,
  size = "sm",
  className,
  lerpMs = 480,
}: Props) {
  const target = clamp((value / max) * 100, 0, 100);
  const [pct, setPct] = useState(target);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    fromRef.current = pct;
    startRef.current = performance.now();
    const tick = (t: number) => {
      const k = clamp((t - startRef.current) / lerpMs, 0, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - k, 3);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setPct(next);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, lerpMs]);

  const s = SIZES[size];
  const grad = VARIANT_GRAD[variant];
  const glow = VARIANT_GLOW[variant];
  const low = variant === "hp" && pct < 25;

  return (
    <div className={clsx("w-full", className)}>
      {(label || showNumber) && (
        <div
          className="flex items-baseline justify-between t-mono"
          style={{ fontSize: s.font }}
        >
          {label && (
            <span className="text-ink-dim tracking-wider2 uppercase">
              {label}
            </span>
          )}
          {showNumber && (
            <span
              className={clsx(
                "tabular-nums",
                variant === "hp" && (low ? "text-danger glow-text-danger" : "text-system-300"),
                variant === "mp" && "text-monarch-300",
                variant === "xp" && "text-quest glow-text-gold",
                variant === "warm" && "text-warm-300",
              )}
            >
              {Math.round((pct / 100) * max)}
              <span className="text-ink-mute">/{max}</span>
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "stat"}
        className="relative mt-1 overflow-hidden"
        style={{
          height: s.h,
          background:
            "linear-gradient(180deg, rgba(10,14,39,0.85), rgba(5,7,20,0.92))",
          border: "1px solid rgba(74,158,255,0.32)",
        }}
      >
        {/* tick marks */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0px, transparent 9px, rgba(74,158,255,0.18) 9px, rgba(74,158,255,0.18) 10px)",
          }}
        />
        {/* fill */}
        <div
          className={clsx("relative h-full transition-[width] duration-100", low && "animate-pulse-system")}
          style={{
            width: `${pct}%`,
            background: grad,
            boxShadow: glow,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 bar-shimmer animate-shimmer mix-blend-screen"
          />
        </div>
        {/* leading edge */}
        <span
          aria-hidden
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `calc(${pct}% - 1px)`,
            background: "rgba(255,255,255,0.85)",
            boxShadow: glow,
          }}
        />
      </div>
    </div>
  );
}

export default StatBar;
