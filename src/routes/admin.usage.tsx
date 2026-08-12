import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell, Card, inputCls } from "@/components/admin/AdminShell";
import { fmtMoney, useAdminStore, usageRows } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/usage")({
  head: () => ({
    meta: [
      { title: "Usage & API Cost — Deed Copilot Internal" },
      { name: "description", content: "Deeds processed per jurisdiction, paid data-API calls, running cost and live-lookup failure rates." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Usage & API Cost — Deed Copilot Internal" },
      { property: "og:description", content: "Internal usage and paid-data spend dashboard." },
    ],
  }),
  component: Usage,
});

const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
] as const;

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${28 - (p / max) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-28">
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Usage() {
  const { jurisdictions, loading, error } = useAdminStore();
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30");
  const [jur, setJur] = useState("all");

  const days = RANGES.find((r) => r.key === range)?.days ?? 30;
  const all = useMemo(() => usageRows(jurisdictions, days), [jurisdictions, days]);
  const rows = useMemo(() => all.filter((r) => (jur === "all" ? true : r.code === jur)), [all, jur]);

  const totalDeeds = rows.reduce((s, r) => s + r.deeds, 0);
  const totalCalls = rows.reduce((s, r) => s + r.apiCalls, 0);
  const totalCost = rows.reduce((s, r) => s + r.apiCost, 0);
  const avgCost = totalDeeds ? totalCost / totalDeeds : 0;
  const spikes = rows.filter((r) => r.apiCost > avgCost * (totalDeeds ? 1.6 : 1) * (r.deeds || 1) / (r.deeds || 1) && r.failureRate >= 8);

  return (
    <AdminShell title="Usage & API-cost dashboard" subtitle="Filter by period and jurisdiction to spot cost spikes and failing live lookups.">
      <Card
        title="Filters"
        action={
          <div className="flex gap-2">
            <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} className="rounded-sm border border-input bg-background px-2 py-1 text-xs">
              {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <select value={jur} onChange={(e) => setJur(e.target.value)} className="rounded-sm border border-input bg-background px-2 py-1 text-xs">
              <option value="all">All jurisdictions</option>
              {usageRows(jurisdictions).map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </div>
        }
      >
        {error ? <p className="mb-3 rounded-sm bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
        {loading ? <p className="mb-3 text-xs text-muted-foreground">Loading backend usage…</p> : null}
        <div className="grid gap-3 sm:grid-cols-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Deeds processed</p><p className="text-xl font-semibold tabular-nums">{totalDeeds.toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground">Paid API calls</p><p className="text-xl font-semibold tabular-nums">{totalCalls.toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground">Running cost</p><p className="text-xl font-semibold tabular-nums">{fmtMoney(totalCost)}</p></div>
          <div><p className="text-xs text-muted-foreground">Cost per deed</p><p className="text-xl font-semibold tabular-nums">{fmtMoney(Math.round(avgCost * 100) / 100)}</p></div>
        </div>
        {spikes.length ? (
          <p className="mt-3 rounded-sm bg-destructive/10 px-3 py-2 text-xs text-destructive">
            ⚑ Elevated live-lookup failures driving retry cost: {spikes.map((s) => `${s.name} (${s.failureRate}%)`).join(", ")}
          </p>
        ) : null}
      </Card>

      <div className="mt-3">
        <Card title="Per-jurisdiction detail">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">Jurisdiction</th>
                <th className="pb-2 text-right font-medium">Deeds</th>
                <th className="pb-2 text-right font-medium">API calls</th>
                <th className="pb-2 text-right font-medium">Cost</th>
                <th className="pb-2 text-right font-medium">Lookup failure</th>
                <th className="pb-2 text-right font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.code}>
                  <td className="py-2">{r.name} <span className="text-xs text-muted-foreground">{r.code}</span></td>
                  <td className="py-2 text-right tabular-nums">{r.deeds.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">{r.apiCalls.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">{fmtMoney(r.apiCost)}</td>
                  <td className={`py-2 text-right tabular-nums ${r.failureRate >= 8 ? "font-semibold text-destructive" : ""}`}>{r.failureRate}%</td>
                  <td className={`py-2 text-right ${r.failureRate >= 8 ? "text-destructive" : "text-muted-foreground"}`}>
                    <div className="flex justify-end"><Sparkline points={r.trend} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Prototype figures. Costs assume $0.38 per billable deed-image / parcel pull.
          </p>
          <input type="hidden" className={inputCls} />
        </Card>
      </div>
    </AdminShell>
  );
}