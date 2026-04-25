import { motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

interface Props {
  /** Called with the recorded audio blob when recording stops */
  onRecorded: (blob: Blob) => void;
  /** Called with audio level 0..1 while recording (RMS) */
  onLevel?: (level: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Press-and-hold to record. WebM/Opus via MediaRecorder.
 * Releases trigger onRecorded. Supports keyboard space-bar global hold.
 */
export function PressToTalk({ onRecorded, onLevel, className, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stop = () => {
    if (mrRef.current && mrRef.current.state !== "inactive") {
      mrRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    setRecording(false);
    onLevel?.(0);
  };

  const start = async () => {
    if (disabled || recording) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mrRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        if (blob.size > 0) onRecorded(blob);
      };
      mr.start();

      // Audio level meter
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (Ctx && onLevel) {
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        src.connect(an);
        analyserRef.current = an;
        const buf = new Uint8Array(an.frequencyBinCount);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          onLevel?.(Math.min(1, rms * 3));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }

      setRecording(true);
    } catch (e) {
      setError((e as Error)?.message || "mic blocked");
      setRecording(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => () => stop(), []);

  // Spacebar push-to-talk (when not typing in an input)
  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      const t = el as HTMLElement | null;
      if (!t) return false;
      const tag = t.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (t as HTMLElement).isContentEditable
      );
    };
    let active = false;
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || isTyping(e.target)) return;
      e.preventDefault();
      if (!active) {
        active = true;
        start();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTyping(e.target)) return;
      e.preventDefault();
      if (active) {
        active = false;
        stop();
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <motion.button
        type="button"
        onMouseDown={start}
        onMouseUp={stop}
        onMouseLeave={() => recording && stop()}
        onTouchStart={(e) => {
          e.preventDefault();
          start();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stop();
        }}
        disabled={disabled}
        whileTap={{ scale: 0.96 }}
        className={clsx(
          "relative h-display flex items-center gap-2 px-4 py-2",
          "border t-mono text-[12px] uppercase tracking-wider2",
          "transition-all duration-200 ease-out-monarch select-none",
          recording
            ? "border-monarch text-monarch-300 glow-text-monarch bg-monarch/15 shadow-glow-monarch"
            : "border-system/60 text-system-300 bg-system/10 hover:bg-system/20 hover:shadow-glow",
          disabled && "opacity-40 pointer-events-none",
        )}
        aria-pressed={recording}
        aria-label="Press and hold to speak"
      >
        <span
          aria-hidden
          className={clsx(
            "inline-block w-2.5 h-2.5 rounded-full",
            recording ? "bg-danger animate-pulse-system" : "bg-system",
          )}
        />
        {recording ? "REC · release to send" : "Press to talk · ⎵"}
      </motion.button>
      {error && (
        <span className="t-mono text-[11px] text-danger">{error}</span>
      )}
    </div>
  );
}

export default PressToTalk;
