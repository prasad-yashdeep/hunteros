import { WS_BASE } from "./api";
import type { SystemEvent } from "../types";

export interface WSConn {
  close: () => void;
}

interface Handlers {
  onMessage: (e: SystemEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Self-reconnecting WebSocket. Backoff caps at 8s.
 */
export function connectStream({ onMessage, onOpen, onClose }: Handlers): WSConn {
  let stopped = false;
  let ws: WebSocket | null = null;
  let backoff = 800;
  let pingTimer: number | null = null;

  const open = () => {
    if (stopped) return;
    ws = new WebSocket(`${WS_BASE}/stream`);
    ws.onopen = () => {
      backoff = 800;
      onOpen?.();
      pingTimer = window.setInterval(() => {
        try {
          ws?.send(JSON.stringify({ type: "ping" }));
        } catch {
          /* noop */
        }
      }, 20000);
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as SystemEvent;
        onMessage(data);
      } catch {
        /* ignore */
      }
    };
    ws.onerror = () => {
      // let onclose handle reconnect
    };
    ws.onclose = () => {
      onClose?.();
      if (pingTimer) {
        window.clearInterval(pingTimer);
        pingTimer = null;
      }
      if (!stopped) {
        const wait = Math.min(8000, backoff);
        backoff = Math.min(8000, backoff * 1.6);
        window.setTimeout(open, wait);
      }
    };
  };

  open();

  return {
    close: () => {
      stopped = true;
      if (pingTimer) window.clearInterval(pingTimer);
      ws?.close();
    },
  };
}
