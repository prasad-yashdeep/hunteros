export function fmtAgo(ms: number | null | undefined): string {
  if (!ms) return "—";
  const delta = Date.now() - ms;
  if (delta < 0) return "now";
  const s = Math.floor(delta / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function fmtNext(ms: number | string | null | undefined): string {
  if (!ms) return "—";
  const t = typeof ms === "string" ? Date.parse(ms) : ms;
  if (!Number.isFinite(t)) return String(ms);
  const delta = t - Date.now();
  if (delta < 0) return "due";
  const s = Math.floor(delta / 1000);
  if (s < 60) return `in ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h`;
  const d = Math.floor(h / 24);
  return `in ${d}d`;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function shortId(id: string, n = 8): string {
  return id ? id.slice(0, n) : "—";
}
