import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

interface Suggestion {
  label: string;
  hint: string;
  text: string; // what gets sent to /command
  destructive?: boolean;
}

const PRESETS: Suggestion[] = [
  { label: "Status report", hint: "describe a hunter", text: "status report on main" },
  { label: "Show all quests", hint: "load the quest board", text: "show me all quests" },
  { label: "Who is online?", hint: "presence ping", text: "who is online" },
  { label: "Arise — spawn main hunter", hint: "summon", text: "arise, spawn a new main hunter" },
  { label: "Snapshot the canvas", hint: "capture", text: "snapshot the canvas" },
  { label: "Toggle shadow mode", hint: "theme", text: "toggle shadow mode" },
  { label: "Dismiss main", hint: "destructive", text: "dismiss main", destructive: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string, opts?: { destructive?: boolean }) => void;
}

export function CommandPalette({ open, onClose, onSubmit }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      // focus next tick
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return PRESETS;
    return PRESETS.filter(
      (s) =>
        s.label.toLowerCase().includes(ql) ||
        s.text.toLowerCase().includes(ql),
    );
  }, [q]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-start justify-center pt-24 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-void/70 backdrop-blur-sl"
          />
          <motion.div
            role="dialog"
            aria-label="Command Console"
            initial={{ y: -16, opacity: 0, scaleY: 0.7 }}
            animate={{ y: 0, opacity: 1, scaleY: 1 }}
            exit={{ y: -8, opacity: 0, scaleY: 0.85 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="sl-panel sl-panel-hi sl-corners scanlines relative w-full max-w-[640px]"
          >
            <span className="corner-bl" />
            <span className="corner-br" />
            <div className="flex items-center gap-3 px-4 py-3 border-b border-system/30">
              <span aria-hidden className="text-system glow-text-system">⌬</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onClose();
                  if (e.key === "Enter") {
                    const target = filtered[0];
                    if (target) {
                      onSubmit(target.text, { destructive: target.destructive });
                      onClose();
                    } else if (q.trim()) {
                      onSubmit(q.trim());
                      onClose();
                    }
                  }
                }}
                placeholder="Speak a command, hunter…"
                className="flex-1 bg-transparent outline-none border-0 t-mono text-[14px] text-ink placeholder:text-ink-mute/70"
                aria-label="Command input"
              />
              <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
                ⏎ run · esc close
              </span>
            </div>
            <ul className="max-h-[55vh] overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 t-mono text-[12px] text-ink-mute">
                  No preset matches. Press ⏎ to send raw text.
                </li>
              )}
              {filtered.map((s) => (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => {
                      onSubmit(s.text, { destructive: s.destructive });
                      onClose();
                    }}
                    className={clsx(
                      "w-full text-left px-4 py-2.5 flex items-baseline gap-3",
                      "hover:bg-system/[0.07] focus:bg-system/[0.1]",
                      "border-b border-system/10 last:border-b-0",
                    )}
                  >
                    <span aria-hidden className="text-system">▸</span>
                    <span className="flex-1">
                      <span className="block h-display text-[14px] text-ink">
                        {s.label}
                      </span>
                      <span className="block t-mono text-[11px] text-ink-mute">
                        {s.text}
                      </span>
                    </span>
                    <span
                      className={clsx(
                        "t-mono text-[10px] uppercase tracking-wider2",
                        s.destructive
                          ? "text-danger glow-text-danger"
                          : "text-ink-mute",
                      )}
                    >
                      {s.destructive ? "DESTRUCTIVE" : s.hint}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
