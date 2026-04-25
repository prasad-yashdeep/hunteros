// Shared types for HunterOS — mirror backend response shapes (best-effort).

export type Rank = "E" | "D" | "C" | "B" | "A" | "S";

export interface AgentActivity {
  sessions: number;
  toolCalls: number;
  elevated: boolean;
  lastEventMs: number;
  load: number;
  recentTools: [string, number][];
}

export interface Agent {
  id: string;
  title: string;
  emoji: string;
  model: string;
  workspace: string;
  routing: string[];
  isDefault: boolean;
  identity?: string;

  rank: Rank;
  power: number;
  level: number;
  hp: number;     // 0-100
  mp: number;     // 0-100
  online: boolean;
  lastSeenMs: number;
  activity: AgentActivity;
}

export interface Cron {
  id: string;
  name: string;
  enabled: boolean;
  schedule: Record<string, unknown>;
  sessionTarget: string;
  lastRun: number | string | null;
  lastStatus: "ok" | "error" | "running" | "unknown" | string;
  nextRun: number | string | null;
}

export interface Session {
  id: string;
  agent: string;
  kind: string;
  channel: string;
  lastActiveMs: number;
  messageCount: number;
}

export interface SystemEvent {
  type: string;
  agent?: string;
  kind?: string;
  summary?: string;
  raw?: Record<string, unknown>;
  ts: number;
  // command.executed / voice.command extras
  intent?: { name: string; slots?: Record<string, unknown>; destructive?: boolean };
  result?: unknown;
  transcript?: string;
  ttsUrl?: string | null;
  needsConfirmation?: boolean;
  // snapshot
  agents?: Agent[];
  crons?: Cron[];
  sessions?: Session[];
}

export interface CommandResponse {
  transcript: string;
  intent: { name: string; slots?: Record<string, unknown>; destructive?: boolean };
  result: unknown;
  needsConfirmation: boolean;
  ttsUrl?: string | null;
}

export type LogLine = {
  id: string;
  ts: number;
  agent?: string;
  kind: string;
  text: string;
  tone: "system" | "monarch" | "ok" | "warn" | "err" | "warm";
};
