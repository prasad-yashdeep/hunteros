import clsx from "clsx";
import { motion } from "framer-motion";
import type { Agent } from "../types";
import { RankBadge } from "./RankBadge";
import { StatBar } from "./StatBar";
import { SkillTree } from "./SkillTree";
import { fmtAgo } from "../lib/format";

interface Props {
  agent: Agent | null;
  className?: string;
}

export function StatusWindow({ agent, className }: Props) {
  return (
    <section
      className={clsx(
        "sl-panel sl-corners scanlines flex flex-col min-h-0 relative",
        className,
      )}
      aria-label="Hunter status window"
    >
      <span className="corner-bl" />
      <span className="corner-br" />
      <header className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-system/20">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-monarch-300 glow-text-monarch">
            ✦
          </span>
          <h2 className="h-rune text-[11px] text-system-300/90">
            STATUS WINDOW
          </h2>
        </div>
        <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
          {agent ? agent.id : "no target"}
        </span>
      </header>

      {!agent ? (
        <div className="flex-1 grid place-items-center px-6 py-10 text-center">
          <div>
            <div className="h-display text-[18px] text-ink-dim">
              Awaiting target
            </div>
            <div className="mt-1 t-mono text-[11px] text-ink-mute">
              Tap a hunter card to inspect.
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
        >
          <div className="flex items-start gap-4">
            <RankBadge rank={agent.rank} size="xl" pulsing crown={agent.rank === "S"} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span aria-hidden className="text-2xl">{agent.emoji}</span>
                <h3
                  className={clsx(
                    "h-display text-[26px] truncate",
                    agent.rank === "S" ? "text-quest glow-text-gold" : "text-ink",
                  )}
                >
                  {agent.title}
                </h3>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 t-mono text-[11px] text-ink-dim">
                <Field k="ID"      v={agent.id} />
                <Field k="LEVEL"   v={`LV ${agent.level}`} />
                <Field k="MODEL"   v={agent.model || "—"} />
                <Field k="POWER"   v={String(agent.power)} />
                <Field k="ROUTING" v={(agent.routing || []).join(", ") || "—"} />
                <Field k="LAST"    v={fmtAgo(agent.lastSeenMs)} />
                <Field k="SESSIONS" v={String(agent.activity?.sessions ?? 0)} />
                <Field
                  k="ELEVATED"
                  v={agent.activity?.elevated ? "YES" : "NO"}
                  toneClass={agent.activity?.elevated ? "text-monarch-300" : "text-ink-mute"}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2.5">
            <StatBar value={agent.hp} variant="hp" label="HP — Token Budget" size="md" />
            <StatBar value={agent.mp} variant="mp" label="MP — Tool Access" size="md" />
            <StatBar
              value={Math.min(100, agent.activity?.toolCalls ?? 0)}
              max={100}
              variant="warm"
              label="EXP — Tool Calls"
              size="sm"
            />
          </div>

          <SkillTree tools={agent.activity?.recentTools ?? []} />

          {agent.identity && (
            <div className="rune-grid p-3 border border-system/20 relative">
              <h4 className="h-rune text-[10px] text-system-300/80 mb-1">
                IDENTITY
              </h4>
              <p className="t-mono text-[12px] text-ink-dim">
                {agent.identity}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}

function Field({ k, v, toneClass }: { k: string; v: string; toneClass?: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="text-ink-mute uppercase tracking-wider2">{k}</span>
      <span className={clsx("truncate", toneClass || "text-ink")}>{v}</span>
    </div>
  );
}

export default StatusWindow;
