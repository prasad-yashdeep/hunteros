import { motion } from "framer-motion";
import clsx from "clsx";
import type { Rank } from "../types";
import { RANK_COLOR, RANK_GLOW, RANK_LABEL } from "../lib/rank";

interface Props {
  rank: Rank;
  size?: "sm" | "md" | "lg" | "xl";
  pulsing?: boolean;
  crown?: boolean;
  className?: string;
}

const SIZE = {
  sm: { box: 24, font: 11, ring: 1 },
  md: { box: 36, font: 16, ring: 1.25 },
  lg: { box: 52, font: 22, ring: 1.5 },
  xl: { box: 80, font: 36, ring: 2 },
};

export function RankBadge({
  rank,
  size = "md",
  pulsing = false,
  crown,
  className,
}: Props) {
  const s = SIZE[size];
  const color = RANK_COLOR[rank];
  const glow = RANK_GLOW[rank];
  const isMonarch = rank === "S" || rank === "A";
  const showCrown = crown ?? rank === "S";

  return (
    <motion.div
      role="img"
      aria-label={`${RANK_LABEL[rank]} hunter`}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className={clsx("relative inline-flex items-center justify-center", className)}
      style={{ width: s.box, height: s.box }}
    >
      {/* Hex/diamond ring (rotated square) */}
      <span
        className={clsx("absolute inset-0", pulsing && "animate-pulse-system")}
        style={{
          transform: "rotate(45deg)",
          border: `${s.ring}px solid ${color}`,
          background: "rgba(10, 14, 39, 0.55)",
          boxShadow: glow,
          backdropFilter: "blur(2px)",
        }}
      />
      {/* Inner thin ring */}
      <span
        className="absolute"
        style={{
          inset: `${Math.round(s.box * 0.16)}px`,
          transform: "rotate(45deg)",
          border: `1px solid ${color}55`,
        }}
      />
      {/* Letter */}
      <span
        className="relative h-rune select-none"
        style={{
          color,
          fontSize: s.font,
          fontFamily: "var(--font-rune)",
          textShadow: `0 0 8px ${color}88, 0 0 16px ${color}55`,
          fontWeight: 700,
          letterSpacing: "0.05em",
        }}
      >
        {rank}
      </span>
      {showCrown && (
        <span
          aria-hidden
          className="absolute"
          style={{
            top: -Math.round(s.box * 0.34),
            fontSize: Math.round(s.box * 0.42),
            color,
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        >
          ♛
        </span>
      )}
      {isMonarch && pulsing && (
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: "rotate(45deg)",
            border: `1px solid ${color}`,
            animation: "pulseSystem 3.6s ease-in-out infinite",
          }}
        />
      )}
    </motion.div>
  );
}

export default RankBadge;
