import clsx from "clsx";
import { motion } from "framer-motion";

interface Props {
  /** [tool, count] pairs from the agent activity */
  tools: [string, number][];
  className?: string;
}

/**
 * SkillTree — most-used tools rendered as a constellation of unlocked nodes.
 * Tool count drives node tier (size + glow). Unused = locked (faded).
 */
export function SkillTree({ tools, className }: Props) {
  const max = Math.max(1, ...tools.map(([, n]) => n));
  return (
    <div
      className={clsx(
        "rune-grid border border-system/20 px-3 py-3 relative",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="h-rune text-[10px] text-system-300/80">SKILL TREE</h4>
        <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
          {tools.length} unlocked
        </span>
      </div>
      {tools.length === 0 ? (
        <div className="t-mono text-[11px] text-ink-mute">
          No skills unlocked yet. Acquire experience by dispatching tasks.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {tools.map(([tool, n], i) => {
            const tier = n / max; // 0..1
            const sz = 6 + Math.round(tier * 8); // 6-14px
            const glow =
              tier > 0.66
                ? "0 0 12px rgba(155,74,255,0.7)"
                : tier > 0.33
                  ? "0 0 10px rgba(74,158,255,0.6)"
                  : "0 0 6px rgba(74,158,255,0.35)";
            const color =
              tier > 0.66 ? "#9b4aff" : tier > 0.33 ? "#4a9eff" : "#79b6ff";
            return (
              <motion.li
                key={tool}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: i * 0.04 }}
                className="flex items-center gap-2 min-w-0"
              >
                <span
                  aria-hidden
                  className="shrink-0 rotate-45"
                  style={{
                    width: sz,
                    height: sz,
                    border: `1.25px solid ${color}`,
                    background: `${color}25`,
                    boxShadow: glow,
                  }}
                />
                <span className="t-mono text-[11px] text-ink truncate">
                  {tool}
                </span>
                <span className="ml-auto t-mono text-[10px] text-ink-mute">
                  {n}×
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SkillTree;
