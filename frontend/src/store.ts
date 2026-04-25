import { create } from "zustand";
import type { Agent, Cron, LogLine, Session, SystemEvent } from "./types";

interface State {
  agents: Agent[];
  crons: Cron[];
  sessions: Session[];
  logs: LogLine[];
  connected: boolean;
  selectedAgentId: string | null;
  toast: { id: string; title: string; body?: string; tone: LogLine["tone"] } | null;
  ariseAt: number;     // when an "arise" anim should fire
  rankUpAt: number;    // when a rank-up burst should fire
  rankUpAgent: string | null;

  setAgents: (a: Agent[]) => void;
  setCrons: (c: Cron[]) => void;
  setSessions: (s: Session[]) => void;
  setConnected: (c: boolean) => void;
  selectAgent: (id: string | null) => void;
  pushLog: (l: LogLine) => void;
  pushEvent: (e: SystemEvent) => void;
  showToast: (
    title: string,
    body?: string,
    tone?: LogLine["tone"],
  ) => void;
  clearToast: () => void;
  triggerArise: () => void;
  triggerRankUp: (agentId: string) => void;
}

let logCounter = 0;
const newLogId = () => `lg_${Date.now()}_${++logCounter}`;

export const useStore = create<State>((set, get) => ({
  agents: [],
  crons: [],
  sessions: [],
  logs: [],
  connected: false,
  selectedAgentId: null,
  toast: null,
  ariseAt: 0,
  rankUpAt: 0,
  rankUpAgent: null,

  setAgents: (agents) => {
    const prev = get().agents;
    // detect rank-ups
    const prevMap = new Map(prev.map((a) => [a.id, a.rank]));
    const promoted = agents.find((a) => {
      const old = prevMap.get(a.id);
      if (!old || old === a.rank) return false;
      const order = "EDCBAS";
      return order.indexOf(a.rank) > order.indexOf(old);
    });
    set({ agents });
    if (promoted) {
      get().triggerRankUp(promoted.id);
      get().pushLog({
        id: newLogId(),
        ts: Date.now(),
        agent: promoted.id,
        kind: "rank.up",
        text: `${promoted.title} ranked up to ${promoted.rank}-Rank.`,
        tone: promoted.rank === "S" ? "warm" : "monarch",
      });
    }
  },
  setCrons: (crons) => set({ crons }),
  setSessions: (sessions) => set({ sessions }),
  setConnected: (connected) => set({ connected }),
  selectAgent: (id) => set({ selectedAgentId: id }),

  pushLog: (l) =>
    set((s) => ({ logs: [l, ...s.logs].slice(0, 200) })),

  pushEvent: (e) => {
    const tone: LogLine["tone"] =
      e.type === "voice.command"
        ? "monarch"
        : e.type === "command.executed"
          ? "system"
          : e.kind === "cron.run.success"
            ? "ok"
            : e.kind === "cron.run.error" || e.kind === "tail.error"
              ? "err"
              : "system";

    let text = "";
    if (e.type === "voice.command") {
      const intent = e.intent?.name ?? "?";
      text = `voice ▸ ${intent} · "${(e.transcript || "").slice(0, 60)}"`;
    } else if (e.type === "command.executed") {
      text = `cmd ▸ ${e.intent?.name ?? "?"}`;
    } else if (e.type === "agents.update") {
      return; // silent refresh
    } else {
      text = e.summary || e.kind || e.type;
    }

    get().pushLog({
      id: newLogId(),
      ts: e.ts,
      agent: e.agent,
      kind: e.kind || e.type,
      text,
      tone,
    });

    if (e.type === "voice.command" && e.intent?.name === "spawn") {
      get().triggerArise();
    }
  },

  showToast: (title, body, tone = "system") =>
    set({ toast: { id: `t_${Date.now()}`, title, body, tone } }),
  clearToast: () => set({ toast: null }),

  triggerArise: () => set({ ariseAt: Date.now() }),
  triggerRankUp: (agentId) => set({ rankUpAt: Date.now(), rankUpAgent: agentId }),
}));
