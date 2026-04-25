import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import type { LogLine } from "../types";
import { fmtAgo } from "../lib/format";

interface Props {
  logs: LogLine[];
  className?: string;
  /** Number of newest entries to show (older are mounted but virtualized off-screen) */
  windowSize?: number;
  title?: string;
}

const TONE: Record<LogLine["tone"], string> = {
  system:  "text-system-300",
  monarch: "text-monarch-300 glow-text-monarch",
  ok:      "text-ok",
  warn:    "text-warn",
  err:     "text-danger glow-text-danger",
  warm:    "text-warm-300 glow-text-warm",
};

const TONE_GLYPH: Record<LogLine["tone"], string> = {
  system:  "▸",
  monarch: "✦",
  ok:      "✓",
  warn:    "▲",
  err:     "✕",
  warm:    "✺",
};

/** Typewriter — reveals chars one at a time. Only fresh lines animate. */
function Typewriter({ text, speed = 14 }: { text: string; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && (
        <span className="inline-block w-[7px] h-[12px] -mb-px bg-system align-middle animate-caret" />
      )}
    </>
  );
}

export function SystemLogLine({ line, fresh }: { line: LogLine; fresh: boolean }) {
  const tone = TONE[line.tone];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -4 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-[14px_56px_1fr] items-baseline gap-2 t-mono text-[12px] py-[3px]"
    >
      <span aria-hidden className={clsx("leading-none", tone)}>
        {TONE_GLYPH[line.tone]}
      </span>
      <span className="text-ink-mute tabular-nums uppercase tracking-wider2 text-[10px]">
        {fmtAgo(line.ts)}
      </span>
      <span className={clsx("truncate", tone)}>
        {fresh ? <Typewriter text={line.text} /> : line.text}
        {line.agent && (
          <span className="ml-2 text-ink-ghost normal-case">@{line.agent}</span>
        )}
      </span>
    </motion.li>
  );
}

export function SystemLog({
  logs,
  className,
  windowSize = 60,
  title = "System Log",
}: Props) {
  const trimmed = logs.slice(0, windowSize);
  const seenRef = useRef<Set<string>>(new Set());
  const freshIds = useRef<Set<string>>(new Set());
  trimmed.forEach((l) => {
    if (!seenRef.current.has(l.id)) {
      freshIds.current.add(l.id);
      seenRef.current.add(l.id);
    }
  });

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
      <header className="flex items-center justify-between px-3 pt-2.5 pb-1.5 border-b border-system/20">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-system glow-text-system">⌬</span>
          <h2 className="h-rune text-[11px] text-system-300/90">
            {title}
          </h2>
        </div>
        <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
          {logs.length} events
        </span>
      </header>
      <ul
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-0.5"
      >
        <AnimatePresence initial={false}>
          {trimmed.length === 0 && (
            <motion.li
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="t-mono text-[12px] text-ink-mute"
            >
              ▸ Awaiting transmissions from the Gate…
            </motion.li>
          )}
          {trimmed.map((l) => (
            <SystemLogLine
              key={l.id}
              line={l}
              fresh={freshIds.current.has(l.id)}
            />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

export default SystemLog;
