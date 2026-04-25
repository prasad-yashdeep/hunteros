import clsx from "clsx";
import { motion } from "framer-motion";
import type { Cron } from "../types";
import { fmtNext } from "../lib/format";

interface Props {
  crons: Cron[];
  onRun?: (cron: Cron) => void;
  className?: string;
  title?: string;
}

const STATUS_TONE: Record<string, { color: string; label: string; glyph: string }> = {
  ok:      { color: "text-ok",     label: "VICTORY", glyph: "✓" },
  success: { color: "text-ok",     label: "VICTORY", glyph: "✓" },
  error:   { color: "text-danger glow-text-danger", label: "FAILED",  glyph: "✕" },
  failed:  { color: "text-danger glow-text-danger", label: "FAILED",  glyph: "✕" },
  running: { color: "text-warn",   label: "ACTIVE",  glyph: "◌" },
  pending: { color: "text-system-300", label: "READY",   glyph: "◇" },
  unknown: { color: "text-ink-mute", label: "—",      glyph: "·" },
};

function statusTone(s: string) {
  const key = (s || "unknown").toLowerCase();
  return STATUS_TONE[key] || STATUS_TONE.unknown;
}

function rankFromName(name: string): "E" | "D" | "C" | "B" | "A" | "S" {
  // playful: longer names → higher quest rank
  const len = (name || "").length;
  if (len > 30) return "S";
  if (len > 22) return "A";
  if (len > 16) return "B";
  if (len > 10) return "C";
  if (len > 5) return "D";
  return "E";
}

const RANK_HUE: Record<string, string> = {
  E: "#6b7393",
  D: "#7fb6e6",
  C: "#4a9eff",
  B: "#5fb7ff",
  A: "#9b4aff",
  S: "#ffcc00",
};

export function QuestRow({
  cron,
  onRun,
}: { cron: Cron; onRun?: (c: Cron) => void }) {
  const tone = statusTone(cron.lastStatus);
  const rank = rankFromName(cron.name);
  const hue = RANK_HUE[rank];

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "group relative grid grid-cols-[20px_18px_1fr_auto_auto_auto] items-center gap-3 px-3 py-2",
        "border-b border-system/10 last:border-b-0",
        "hover:bg-system/[0.04] transition-colors",
      )}
    >
      <span
        aria-hidden
        className="t-mono text-[10px] tracking-wider2 text-center"
        style={{ color: hue, textShadow: `0 0 6px ${hue}66` }}
      >
        {rank}
      </span>
      <span aria-hidden className="text-system text-base leading-none">⚔</span>
      <div className="min-w-0">
        <div
          className={clsx(
            "h-display text-[14px] truncate",
            cron.enabled ? "text-ink" : "text-ink-mute line-through",
          )}
        >
          {cron.name}
        </div>
        {cron.sessionTarget && (
          <div className="t-mono text-[10px] text-ink-mute truncate">
            ↳ {cron.sessionTarget}
          </div>
        )}
      </div>
      <span
        className={clsx(
          "t-mono text-[10px] uppercase tracking-wider2 flex items-center gap-1",
          tone.color,
        )}
      >
        <span aria-hidden>{tone.glyph}</span>
        {tone.label}
      </span>
      <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2 tabular-nums">
        {fmtNext(cron.nextRun)}
      </span>
      <button
        type="button"
        onClick={() => onRun?.(cron)}
        className={clsx(
          "t-mono text-[10px] uppercase tracking-wider2 px-2 py-1",
          "border border-system/40 text-system-300 bg-system/5",
          "hover:bg-system/15 hover:border-system/80 hover:shadow-glow-sm transition-all",
          "opacity-0 group-hover:opacity-100",
        )}
        aria-label={`Run quest ${cron.name}`}
      >
        ▶ run
      </button>
    </motion.li>
  );
}

export function QuestBoard({ crons, onRun, className, title = "Quest Board" }: Props) {
  const active = crons.filter((c) => c.enabled).length;
  return (
    <section
      className={clsx(
        "sl-panel sl-corners scanlines flex flex-col min-h-0",
        className,
      )}
      aria-label={title}
    >
      <span className="corner-bl" />
      <span className="corner-br" />
      <header className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-system/20">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-quest glow-text-gold">⚔</span>
          <h2 className="h-rune text-[11px] text-system-300/90">{title}</h2>
          <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
            · {active} active
          </span>
        </div>
        <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
          {crons.length} total
        </span>
      </header>
      {crons.length === 0 ? (
        <div className="px-3 py-6 text-center t-mono text-[12px] text-ink-mute">
          ⚔ No quests posted on the board.
        </div>
      ) : (
        <ul className="overflow-y-auto">
          {crons.map((c) => (
            <QuestRow key={c.id || c.name} cron={c} onRun={onRun} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default QuestBoard;
