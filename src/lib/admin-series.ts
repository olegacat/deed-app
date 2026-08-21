import { mrrOf, type Account } from "./admin-store";

export interface SeriesPoint {
  date: string;
  label: string;
  users: number;
  mrr: number;
  deeds: number;
}

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function rnd(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Builds a back-cast daily series that lands exactly on today's real
 * account count and MRR, so the charts agree with the dashboard tiles.
 */
export function buildSeries(accounts: Account[], days: number): SeriesPoint[] {
  const usersNow = accounts.length;
  const mrrNow = accounts.reduce((s, a) => s + mrrOf(a), 0);
  const step = days > 60 ? 3 : 1;
  const out: SeriesPoint[] = [];

  for (let i = days; i >= 0; i -= step) {
    const t = 1 - i / days; // 0 → start, 1 → today
    const growth = 0.68 + 0.32 * t; // ~32% growth across the window
    const wobbleU = (rnd(i + 7) - 0.5) * 0.05;
    const wobbleM = (rnd(i + 91) - 0.5) * 0.06;
    const d = new Date(Date.now() - i * 86_400_000);
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      users: i === 0 ? usersNow : Math.max(1, Math.round(usersNow * (growth + wobbleU))),
      mrr: i === 0 ? mrrNow : Math.max(0, Math.round((mrrNow * (growth + wobbleM)) / 10) * 10),
      deeds: Math.max(3, Math.round(26 * (growth + wobbleU * 3))),
    });
  }
  return out;
}

export function delta(series: SeriesPoint[], key: "users" | "mrr") {
  if (series.length < 2) return { abs: 0, pct: 0 };
  const first = series[0]![key];
  const last = series[series.length - 1]![key];
  return { abs: last - first, pct: first ? Math.round(((last - first) / first) * 100) : 0 };
}
