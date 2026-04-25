import type { Agent, CommandResponse, Cron, Session } from "../types";

export const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env
    ?.VITE_API_BASE || "http://127.0.0.1:7777";
export const WS_BASE = API_BASE.replace(/^http/, "ws");

async function safeJson<T>(p: Promise<Response>, fallback: T): Promise<T> {
  try {
    const res = await p;
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const api = {
  agents: () => safeJson<Agent[]>(fetch(`${API_BASE}/agents`), []),
  crons: () => safeJson<Cron[]>(fetch(`${API_BASE}/crons`), []),
  sessions: () =>
    safeJson<Session[]>(fetch(`${API_BASE}/sessions?active=1`), []),
  command: (text: string, confirm = false) =>
    safeJson<CommandResponse | null>(
      fetch(`${API_BASE}/command`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, confirm }),
      }),
      null,
    ),
  voiceCommand: async (
    blob: Blob,
    opts: { autoSpeak?: boolean; confirm?: boolean } = {},
  ): Promise<CommandResponse | null> => {
    const fd = new FormData();
    fd.append("audio", blob, "rec.webm");
    fd.append("autoSpeak", opts.autoSpeak === false ? "0" : "1");
    fd.append("confirm", opts.confirm ? "1" : "0");
    try {
      const res = await fetch(`${API_BASE}/voice/command`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) return null;
      return (await res.json()) as CommandResponse;
    } catch {
      return null;
    }
  },
  ttsUrl: (path: string | null | undefined) =>
    path ? `${API_BASE}${path}` : null,
};
