import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

import { api } from "./lib/api";
import { connectStream } from "./lib/ws";
import { useStore } from "./store";
import type { CommandResponse, Cron, SystemEvent } from "./types";

import { HunterGrid } from "./components/HunterCard";
import { QuestBoard } from "./components/QuestBoard";
import { SystemLog } from "./components/SystemLog";
import { SystemNotification } from "./components/SystemNotification";
import { VoiceOrb } from "./components/VoiceOrb";
import { CommandPalette } from "./components/CommandPalette";
import { ApprovalModal } from "./components/ApprovalModal";
import { StatusWindow } from "./components/StatusWindow";
import { PressToTalk } from "./components/PressToTalk";

function App() {
  const agents = useStore((s) => s.agents);
  const crons = useStore((s) => s.crons);
  const sessions = useStore((s) => s.sessions);
  const logs = useStore((s) => s.logs);
  const connected = useStore((s) => s.connected);
  const selectedAgentId = useStore((s) => s.selectedAgentId);
  const toast = useStore((s) => s.toast);
  const ariseAt = useStore((s) => s.ariseAt);

  const setAgents = useStore((s) => s.setAgents);
  const setCrons = useStore((s) => s.setCrons);
  const setSessions = useStore((s) => s.setSessions);
  const setConnected = useStore((s) => s.setConnected);
  const pushEvent = useStore((s) => s.pushEvent);
  const showToast = useStore((s) => s.showToast);
  const clearToast = useStore((s) => s.clearToast);
  const triggerArise = useStore((s) => s.triggerArise);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pending, setPending] = useState<{
    text: string;
    title: string;
    body: string;
  } | null>(null);
  const [voiceState, setVoiceState] =
    useState<"idle" | "listening" | "speaking">("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const selected = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId],
  );

  // ─── Initial fetch ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [a, c, s] = await Promise.all([
        api.agents(),
        api.crons(),
        api.sessions(),
      ]);
      if (cancelled) return;
      setAgents(a);
      setCrons(c);
      setSessions(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [setAgents, setCrons, setSessions]);

  // ─── WebSocket firehose ─────────────────────────────────────────────
  useEffect(() => {
    const conn = connectStream({
      onOpen: () => {
        setConnected(true);
        showToast("Gate opened", "Connected to the System.", "ok");
      },
      onClose: () => {
        setConnected(false);
      },
      onMessage: (evt: SystemEvent) => {
        switch (evt.type) {
          case "snapshot":
            if (evt.agents) setAgents(evt.agents);
            if (evt.crons) setCrons(evt.crons);
            if (evt.sessions) setSessions(evt.sessions);
            break;
          case "agents.update":
            if (evt.agents) setAgents(evt.agents);
            break;
          case "voice.command":
          case "command.executed":
            pushEvent(evt);
            break;
          default:
            pushEvent(evt);
        }
      },
    });
    return () => conn.close();
  }, [setAgents, setCrons, setSessions, setConnected, pushEvent, showToast]);

  // ─── Toast auto-dismiss ─────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => clearToast(), 3800);
    return () => window.clearTimeout(id);
  }, [toast, clearToast]);

  // ─── Cmd-K command palette ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((x) => !x);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ─── TTS playback ───────────────────────────────────────────────────
  const playTts = useCallback((url: string | null | undefined) => {
    const full = api.ttsUrl(url);
    if (!full) return;
    setVoiceState("speaking");
    if (!audioElRef.current) audioElRef.current = new Audio();
    const a = audioElRef.current;
    a.src = full;
    a.onended = () => setVoiceState("idle");
    a.onerror = () => setVoiceState("idle");
    a.play().catch(() => setVoiceState("idle"));
  }, []);

  // ─── Submit text command ────────────────────────────────────────────
  const submitText = useCallback(
    async (text: string, opts: { destructive?: boolean; confirm?: boolean } = {}) => {
      const res = (await api.command(text, !!opts.confirm)) as CommandResponse | null;
      if (!res) {
        showToast("Command failed", "Could not reach the System.", "err");
        return;
      }
      if (res.needsConfirmation) {
        setPending({
          text,
          title: `Confirm: ${res.intent.name}`,
          body: `This intent is marked destructive. ${
            (res.intent.slots && (res.intent.slots as { agent?: string }).agent) || ""
          }`.trim(),
        });
        return;
      }
      // toast for status feedback
      showToast(
        intentTitle(res.intent.name),
        text,
        opts.destructive ? "warn" : "system",
      );
      if (res.intent.name === "spawn") triggerArise();
    },
    [showToast, triggerArise],
  );

  // ─── Voice recording ────────────────────────────────────────────────
  const onRecorded = useCallback(
    async (blob: Blob) => {
      setVoiceState("listening");
      const res = await api.voiceCommand(blob, { autoSpeak: true });
      setAudioLevel(0);
      if (!res) {
        setVoiceState("idle");
        showToast("Voice failed", "Could not transcribe.", "err");
        return;
      }
      if (res.needsConfirmation) {
        setVoiceState("idle");
        setPending({
          text: res.transcript || "",
          title: `Confirm: ${res.intent.name}`,
          body: `Heard: "${res.transcript}"`,
        });
        return;
      }
      showToast(intentTitle(res.intent.name), `"${res.transcript}"`, "monarch");
      if (res.intent.name === "spawn") triggerArise();
      if (res.ttsUrl) playTts(res.ttsUrl);
      else setVoiceState("idle");
    },
    [showToast, triggerArise, playTts],
  );

  // ─── Quest run ──────────────────────────────────────────────────────
  const runCron = useCallback(
    (cron: Cron) => {
      submitText(`run quest ${cron.id || cron.name}`);
    },
    [submitText],
  );

  // ─── Render ─────────────────────────────────────────────────────────
  const onlineCount = agents.filter((a) => a.online).length;
  const totalLevel = agents.reduce((sum, a) => sum + (a.level || 0), 0);

  return (
    <div className="h-screen w-screen relative text-ink overflow-hidden">
      {/* Global rune-grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(74,158,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0) 100%)",
        }}
      />

      <SystemNotification toast={toast} onDismiss={clearToast} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSubmit={(text, opts) => submitText(text, opts)}
      />

      <ApprovalModal
        open={!!pending}
        title={pending?.title ?? ""}
        body={pending?.body}
        confirmLabel="Execute"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) {
            const t = pending.text;
            setPending(null);
            submitText(t, { confirm: true, destructive: true });
          }
        }}
      />

      <div className="flex flex-col h-full">
        {/* ─── Header ──────────────────────────────────────────────── */}
        <header className="relative shrink-0 px-6 py-3 border-b border-system/20 bg-void/60 backdrop-blur-sl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="text-system glow-text-system text-2xl leading-none animate-flicker"
              >
                ⌬
              </span>
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="h-display text-[26px] leading-none text-ink">
                    HunterOS
                  </h1>
                  <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
                    v0.1 · the System
                  </span>
                </div>
                <div className="t-mono text-[11px] text-ink-mute mt-0.5">
                  Shadow Monarch:{" "}
                  <span className="text-monarch-300 glow-text-monarch">Operator</span>
                  <span className="mx-2 text-ink-ghost">·</span>
                  Total Lv:
                  <span className="ml-1 text-quest glow-text-gold">
                    {totalLevel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Stat label="HUNTERS" value={`${onlineCount}/${agents.length}`} />
              <Stat
                label="QUESTS"
                value={`${crons.filter((c) => c.enabled).length}`}
              />
              <Stat label="DUNGEONS" value={`${sessions.length}`} />
              <span
                className={clsx(
                  "t-mono text-[10px] uppercase tracking-wider2 px-2 py-1 border",
                  connected
                    ? "text-ok border-ok/40 bg-ok/5"
                    : "text-danger border-danger/40 bg-danger/5",
                )}
              >
                <span
                  className={clsx(
                    "inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle",
                    connected
                      ? "bg-ok shadow-[0_0_6px_#5fffb0]"
                      : "bg-danger shadow-[0_0_6px_#ff4a4a]",
                  )}
                />
                {connected ? "GATE OPEN" : "GATE SEALED"}
              </span>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="t-mono text-[11px] uppercase tracking-wider2 px-3 py-1.5 border border-system/50 bg-system/10 text-system-300 hover:bg-system/20 hover:shadow-glow transition"
                aria-label="Open command console (cmd+k)"
              >
                ⌘K · console
              </button>
              <PressToTalk onRecorded={onRecorded} onLevel={setAudioLevel} />
            </div>
          </div>
        </header>

        {/* ─── Body grid ──────────────────────────────────────────── */}
        <main
          className="grid flex-1 min-h-0 px-6 py-4 gap-4"
          style={{
            gridTemplateColumns: "320px 1fr 360px",
            gridTemplateRows: "minmax(0, 1.4fr) minmax(0, 1fr)",
          }}
        >
          {/* Hunters column (spans both rows) */}
          <section
            aria-label="Hunters"
            className="row-span-2 flex flex-col min-h-0 gap-3 overflow-hidden"
          >
            <SectionHeading
              glyph="⚔"
              title="HUNTERS"
              meta={`${agents.length} registered`}
            />
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <HunterGrid agents={agents} />
            </div>
          </section>

          {/* Center: 3D Hero + Status */}
          <section className="flex flex-col min-h-0 gap-4">
            <div className="relative flex-1 min-h-0 sl-panel sl-corners scanlines overflow-hidden">
              <span className="corner-bl" />
              <span className="corner-br" />
              {/* Title strip */}
              <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-monarch-300 glow-text-monarch">
                    ✦
                  </span>
                  <h2 className="h-rune text-[11px] text-system-300/90">
                    MONARCH SIGIL
                  </h2>
                </div>
                <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
                  {voiceState === "idle"
                    ? "standby"
                    : voiceState === "listening"
                      ? "listening…"
                      : "speaking…"}
                </span>
              </div>
              <VoiceOrb
                state={voiceState}
                ariseAt={ariseAt}
                audioLevel={audioLevel}
              />
              {/* Footer hint */}
              <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="h-display text-[20px] text-ink-dim glow-text-system"
                >
                  Arise.
                </motion.div>
                <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
                  hold ⎵ space — or press to talk
                </span>
              </div>
            </div>
            <StatusWindow agent={selected} className="h-[260px]" />
          </section>

          {/* Right: System Log + Active Dungeons */}
          <section className="flex flex-col min-h-0 gap-4">
            <SystemLog logs={logs} className="flex-1 min-h-0" />
            <div className="sl-panel sl-corners scanlines flex flex-col h-[200px]">
              <span className="corner-bl" />
              <span className="corner-br" />
              <header className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-system/20">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-system glow-text-system">
                    ⌗
                  </span>
                  <h2 className="h-rune text-[11px] text-system-300/90">
                    DUNGEONS
                  </h2>
                </div>
                <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
                  {sessions.length} active
                </span>
              </header>
              {sessions.length === 0 ? (
                <div className="flex-1 grid place-items-center text-center px-3 t-mono text-[12px] text-ink-mute">
                  ▸ no active dungeons.
                </div>
              ) : (
                <ul className="flex-1 overflow-y-auto">
                  {sessions.map((s, idx) => (
                    <li
                      key={`${s.id || "s"}-${s.agent || "a"}-${idx}`}
                      className="px-3 py-2 border-b border-system/10 last:border-b-0 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5"
                    >
                      <span className="h-display text-[13px] text-ink truncate">
                        {s.agent}
                      </span>
                      <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2 tabular-nums">
                        {s.messageCount} msg
                      </span>
                      <span className="t-mono text-[10px] text-ink-mute truncate">
                        {s.kind}
                        {s.channel && ` · @${s.channel}`}
                      </span>
                      <span className="t-mono text-[10px] text-ink-mute uppercase tabular-nums text-right">
                        {s.id.slice(0, 8) || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Quest board — bottom, spans columns 2-3 */}
          <section className="col-start-2 col-end-4 row-start-2 min-h-0 overflow-hidden">
            <QuestBoard crons={crons} onRun={runCron} className="h-full" />
          </section>
        </main>

        {/* ─── Footer ────────────────────────────────────────────── */}
        <footer className="shrink-0 flex items-center justify-between px-6 py-2 border-t border-system/15 t-mono text-[10px] uppercase tracking-wider2 text-ink-mute">
          <span>
            <span className="text-system-300">⌬</span> the system · openclaw
            gateway · 127.0.0.1:7777
          </span>
          <span>
            ⎵ talk · ⌘K console ·{" "}
            <span className="text-monarch-300 glow-text-monarch">arise</span>
          </span>
        </footer>
      </div>
    </div>
  );
}

function intentTitle(name: string): string {
  switch (name) {
    case "spawn":      return "Hunter summoned";
    case "status":     return "Status report";
    case "dispatch":   return "Quest dispatched";
    case "kill":       return "Hunter dismissed";
    case "presence":   return "Presence ping";
    case "crons":      return "Quest board loaded";
    case "cron.run":   return "Quest executing";
    case "snapshot":   return "Canvas captured";
    case "theme":      return "Shadow mode toggled";
    case "unknown":    return "Unrecognized command";
    default:           return name;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="t-mono text-[9px] text-ink-mute uppercase tracking-wider2">
        {label}
      </span>
      <span className="h-display text-[18px] text-system-300 glow-text-system tabular-nums leading-none">
        {value}
      </span>
    </div>
  );
}

function SectionHeading({
  glyph,
  title,
  meta,
}: {
  glyph: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-system glow-text-system">
          {glyph}
        </span>
        <h2 className="h-rune text-[11px] text-system-300/90">{title}</h2>
      </div>
      {meta && (
        <span className="t-mono text-[10px] text-ink-mute uppercase tracking-wider2">
          {meta}
        </span>
      )}
    </div>
  );
}

export default App;
