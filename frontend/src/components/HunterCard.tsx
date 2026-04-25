import { motion } from "framer-motion";
import clsx from "clsx";
import type { Agent } from "../types";
import { RankBadge } from "./RankBadge";
import { StatBar } from "./StatBar";
import { fmtAgo } from "../lib/format";
import { useStore } from "../store";

interface Props {
  agent: Agent;
  selected?: boolean;
  rankUpFlashAt?: number; // when to play violet burst
  onClick?: () => void;
}

export function HunterCard({ agent, selected, rankUpFlashAt, onClick }: Props) {
  const isMonarch = agent.rank === "S";
  const isElite = agent.rank === "A" || agent.rank === "S";
  const recentTools = agent.activity?.recentTools?.slice(0, 3) ?? [];
  const flashing =
    !!rankUpFlashAt && Date.now() - rankUpFlashAt < 1200;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "group relative w-full text-left sl-panel sl-corners scanlines",
        "px-4 py-3.5",
        "transition-all duration-200 ease-out-monarch",
        selected && "sl-panel-hi",
        isMonarch && "ring-1 ring-monarch/40",
        !agent.online && "opacity-70 saturate-50",
      )}
      aria-pressed={selected}
      aria-label={`Hunter ${agent.title}, ${agent.rank}-Rank, level ${agent.level}`}
    >
      <span className="corner-bl" />
      <span className="corner-br" />

      {/* Rank-up violet burst */}
      {flashing && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span
            className="absolute rounded-full animate-rank-burst"
            style={{
              width: 80,
              height: 80,
              background:
                "radial-gradient(circle, rgba(155,74,255,0.55) 0%, rgba(155,74,255,0) 70%)",
              boxShadow: "0 0 32px rgba(155,74,255,0.6)",
            }}
          />
        </span>
      )}

      <div className="flex items-start gap-3">
        <RankBadge
          rank={agent.rank}
          size="lg"
          pulsing={isElite}
          crown={isMonarch}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span aria-hidden className="text-base leading-none">
                {agent.emoji}
              </span>
              <span
                className={clsx(
                  "h-display text-[17px] truncate",
                  isMonarch ? "text-quest glow-text-gold" : "text-ink",
                )}
              >
                {agent.title}
              </span>
            </div>
            <span
              className={clsx(
                "t-mono text-[10px] tracking-wider2 uppercase shrink-0",
                agent.online ? "text-ok" : "text-ink-mute",
              )}
            >
              <span
                className={clsx(
                  "inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle",
                  agent.online
                    ? "bg-ok shadow-[0_0_6px_#5fffb0]"
                    : "bg-ink-ghost",
                )}
              />
              {agent.online ? "online" : fmtAgo(agent.lastSeenMs)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 t-mono text-[11px] text-ink-mute">
            <span className="uppercase tracking-wider2">
              LV {String(agent.level).padStart(2, "0")}
            </span>
            <span aria-hidden>·</span>
            <span className="truncate">{agent.model || "—"}</span>
            {agent.activity.elevated && (
              <>
                <span aria-hidden>·</span>
                <span className="text-monarch-300 glow-text-monarch uppercase tracking-wider2">
                  elevated
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-1.5">
        <StatBar value={agent.hp} variant="hp" label="HP" size="sm" />
        <StatBar value={agent.mp} variant="mp" label="MP" size="sm" />
      </div>

      {recentTools.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {recentTools.map(([tool, n]) => (
            <span
              key={tool}
              className="t-mono text-[10px] uppercase tracking-wider2 px-1.5 py-0.5 border border-system/30 text-system-300/90 bg-system/5"
              title={`${tool} · ${n}×`}
            >
              {tool}
              <span className="ml-1 text-ink-mute">×{n}</span>
            </span>
          ))}
        </div>
      )}

      {/* hover bottom rune line */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-system to-transparent opacity-0 group-hover:opacity-90 transition-opacity"
      />
    </motion.button>
  );
}

interface GridProps {
  agents: Agent[];
  className?: string;
}

export function HunterGrid({ agents, className }: GridProps) {
  const selectedAgentId = useStore((s) => s.selectedAgentId);
  const selectAgent = useStore((s) => s.selectAgent);
  const rankUpAt = useStore((s) => s.rankUpAt);
  const rankUpAgent = useStore((s) => s.rankUpAgent);

  if (!agents.length) {
    return (
      <div
        className={clsx(
          "sl-panel sl-corners scanlines p-6 text-center text-ink-mute t-mono uppercase tracking-wider2 text-xs",
          className,
        )}
      >
        <span className="corner-bl" />
        <span className="corner-br" />
        // No hunters detected. The Gate is silent.
      </div>
    );
  }
  return (
    <div className={clsx("grid gap-2.5", className)}>
      {agents.map((a) => (
        <HunterCard
          key={a.id}
          agent={a}
          selected={selectedAgentId === a.id}
          rankUpFlashAt={rankUpAgent === a.id ? rankUpAt : 0}
          onClick={() =>
            selectAgent(selectedAgentId === a.id ? null : a.id)
          }
        />
      ))}
    </div>
  );
}

export default HunterCard;
