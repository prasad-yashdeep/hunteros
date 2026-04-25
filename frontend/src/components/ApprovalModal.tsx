import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ApprovalModal({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-void/80 backdrop-blur-sl"
            onClick={onCancel}
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 4 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative sl-panel sl-corners scanlines w-full max-w-[460px] p-5"
            style={{ borderColor: "rgba(255,74,74,0.65)" }}
          >
            <span className="corner-bl" style={{ borderColor: "#ff4a4a" }} />
            <span className="corner-br" style={{ borderColor: "#ff4a4a" }} />
            <div className="flex items-center gap-2 mb-2">
              <span aria-hidden className="text-danger glow-text-danger text-lg leading-none">
                ⚠
              </span>
              <h2 className="h-rune text-[11px] text-danger glow-text-danger">
                CONFIRMATION REQUIRED
              </h2>
            </div>
            <h3 className="h-display text-[20px] text-ink leading-tight">
              {title}
            </h3>
            {body && (
              <p className="mt-2 t-mono text-[12px] text-ink-dim">
                {body}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 t-mono text-[11px] uppercase tracking-wider2 border border-system/40 text-ink-dim hover:bg-system/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-3 py-1.5 t-mono text-[11px] uppercase tracking-wider2 border border-danger/70 text-danger glow-text-danger bg-danger/10 hover:bg-danger/20"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ApprovalModal;
