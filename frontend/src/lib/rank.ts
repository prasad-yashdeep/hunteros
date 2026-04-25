import type { Rank } from "../types";

export const RANK_TIERS: Rank[] = ["E", "D", "C", "B", "A", "S"];

export const RANK_COLOR: Record<Rank, string> = {
  E: "#6b7393",
  D: "#7fb6e6",
  C: "#4a9eff",
  B: "#5fb7ff",
  A: "#9b4aff",
  S: "#ffcc00",
};

export const RANK_GLOW: Record<Rank, string> = {
  E: "0 0 4px rgba(107,115,147,0.5)",
  D: "0 0 8px rgba(127,182,230,0.55), 0 0 18px rgba(127,182,230,0.25)",
  C: "0 0 10px rgba(74,158,255,0.65), 0 0 24px rgba(74,158,255,0.3)",
  B: "0 0 12px rgba(95,183,255,0.7), 0 0 28px rgba(95,183,255,0.35)",
  A: "0 0 14px rgba(155,74,255,0.75), 0 0 32px rgba(155,74,255,0.4)",
  S: "0 0 18px rgba(255,204,0,0.85), 0 0 40px rgba(255,204,0,0.5), 0 0 80px rgba(255,204,0,0.25)",
};

export const RANK_LABEL: Record<Rank, string> = {
  E: "E-Rank",
  D: "D-Rank",
  C: "C-Rank",
  B: "B-Rank",
  A: "A-Rank",
  S: "S-Rank",
};
