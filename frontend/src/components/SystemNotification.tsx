import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { LogLine } from "../types";

interface Props {
  toast: { id: string; title: string; body?: string; tone: LogLine["tone"] } | null;
  onDismiss?: () => void;
}

const TONE_BORDER: Record<LogLine["tone"], string> = {
  system:  "border-system/70 shadow-glow",
  monarch: "border-monarch/70 shadow-glow-monarch",
  ok:      "border-ok/70 shadow-glow",
  warn:    "border-warn/70 shadow-glow-gold",
  err:     "border-danger/70 shadow-glow-danger",
  warm:    "border-warm/70 shadow-glow-warm",
};

const TONE_TEXT: Record<LogLine["tone"], string> = {
  system:  "text-system-100 glow-text-system",
  monarch: "text-monarch-300 glow-text-monarch",
  ok:      "text-ok",
  warn:    "text-warn glow-text-gold",
  err:     "text-danger glow-text-danger",
  warm:    "text-warm-300 glow-text-warm",
};

export function SystemNotification({ toast, onDismiss }: Props) {
  return (
    <div
      aria-live="assertive"
      role="status"
      className="pointer-events-none fixed top-6 left-1/2 -translate-x-1/2 z-50"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -16, opacity: 0, scaleY: 0.5, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, scaleY: 1, filter: "blur(0px)" }}
            exit={{ y: -8, opacity: 0, scaleY: 0.85, filter: "blur(4px)" }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className={clsx(
              "pointer-events-auto sl-corners relative",
              "min-w-[340px] max-w-[480px] px-5 py-3",
              "bg-void/85 backdrop-blur-sl border",
              TONE_BORDER[toast.tone],
            )}
            onClick={onDismiss}
          >
            <span className="corner-bl" />
            <span className="corner-br" />
            <div
              className={clsx(
                "h-rune text-[10px] tracking-wider2 mb-1 flex items-center gap-2",
                TONE_TEXT[toast.tone],
              )}
            >
              <span aria-hidden>⌬</span>
              <span>SYSTEM</span>
              <span aria-hidden className="ml-auto opacity-50">⌬</span>
            </div>
            <div
              className={clsx(
                "h-display text-[18px] leading-tight",
                TONE_TEXT[toast.tone],
              )}
            >
              {toast.title}
            </div>
            {toast.body && (
              <div className="mt-1 t-mono text-[12px] text-ink-dim">
                {toast.body}
              </div>
            )}
            {/* drifting scan line */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 h-px bg-system/70"
              style={{
                top: "50%",
                animation: "scan 2.4s linear infinite",
                opacity: 0.25,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SystemNotification;
