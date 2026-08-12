import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildSeries, delta } from "@/lib/admin-series";
import { fmtMoney, type Account } from "@/lib/admin-store";

const RANGES = [
  { key: "30", label: "30d", days: 30 },
  { key: "90", label: "90d", days: 90 },
  { key: "180", label: "6m", days: 180 },
] as const;

function Delta({ abs, pct, money }: { abs: number; pct: number; money?: boolean }) {
  const up = abs >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${
        up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
      }`}
    >
      {up ? "▲" : "▼"} {money ? fmtMoney(Math.abs(abs)) : Math.abs(abs)} ({pct}%)
    </span>
  );
}

function ChartTooltip({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
      <p className="mb-0.5 font-medium">{label}</p>
      <p className="tabular-nums text-muted-foreground">
        {money ? fmtMoney(payload[0].value) : `${payload[0].value} accounts`}
      </p>
    </div>
  );
}

export function GrowthCharts({ accounts }: { accounts: Account[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("90");
  const days = RANGES.find((r) => r.key === range)?.days ?? 90;
  const series = useMemo(() => buildSeries(accounts, days), [accounts, days]);
  const du = delta(series, "users");
  const dm = delta(series, "mrr");
  const tick = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;

  const panels = [
    {
      key: "users",
      title: "Active users",
      value: String(series[series.length - 1]?.users ?? 0),
      d: <Delta abs={du.abs} pct={du.pct} />,
      color: "var(--color-primary)",
      money: false,
      fmt: (v: number) => String(v),
    },
    {
      key: "mrr",
      title: "MRR",
      value: fmtMoney(series[series.length - 1]?.mrr ?? 0),
      d: <Delta abs={dm.abs} pct={dm.pct} money />,
      color: "var(--color-success)",
      money: true,
      fmt: (v: number) => `$${Math.round(v / 100) / 10}k`,
    },
  ] as const;

  return (
    <section className="rounded-sm border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Growth over time</h2>
          <p className="text-xs text-muted-foreground">Users and recurring revenue by date.</p>
        </div>
        <div className="flex rounded-sm border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-px bg-border md:grid-cols-2">
        {panels.map((p) => (
          <div key={p.key} className="bg-card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{p.title}</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums">{p.value}</p>
              </div>
              {p.d}
            </div>
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} minTickGap={28} />
                  <YAxis
                    tick={tick}
                    tickLine={false}
                    axisLine={false}
                    width={46}
                    tickFormatter={p.fmt as (v: number) => string}
                  />
                  <Tooltip content={<ChartTooltip money={p.money} />} />
                  <Line
                    type="monotone"
                    dataKey={p.key}
                    stroke={p.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
