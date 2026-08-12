import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Building2, DollarSign, FileText, Map, Server } from "lucide-react";
import { AdminShell, Card, StatusPill } from "@/components/admin/AdminShell";
import { GrowthCharts } from "@/components/admin/GrowthCharts";
import {
  PLAN_LABEL,
  fmtMoney,
  mrrOf,
  useAdminStore,
  usageRows,
  type PlanTier,
} from "@/lib/admin-store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Deed Copilot Internal" },
      { name: "description", content: "Internal operations dashboard: accounts, MRR, deed volume, API spend and jurisdiction health." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Dashboard — Deed Copilot Internal" },
      { property: "og:description", content: "Internal operations dashboard for the Deed Copilot team." },
    ],
  }),
  component: Dashboard,
});

function Metric({
  label,
  value,
  sub,
  to,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  to: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <Link
      to={to}
      className="group block rounded-sm border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="flex size-7 items-center justify-center rounded-sm bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
      {sub ? <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div> : null}
    </Link>
  );
}

function Dashboard() {
  const { accounts, jurisdictions } = useAdminStore();

  const activeish = accounts.filter((a) => a.status === "active" || a.status === "trial" || a.status === "past_due");
  const byTier = (["starter", "professional", "firm"] as PlanTier[]).map((t) => ({
    tier: t,
    count: activeish.filter((a) => a.plan === t).length,
  }));
  const mrr = accounts.reduce((s, a) => s + mrrOf(a), 0);
  const lastMrr = Math.round(mrr * 0.92);
  const trend = mrr - lastMrr;
  const pastDue = accounts.filter((a) => a.status === "past_due");
  const rows = usageRows(jurisdictions);
  const deeds = rows.reduce((s, r) => s + r.deeds, 0);
  const apiSpend = rows.reduce((s, r) => s + r.apiCost, 0);
  const live = jurisdictions.filter((j) => j.status === "live");
  const beta = jurisdictions.filter((j) => j.status === "beta");
  const degraded = live.filter((j) => j.lookupFailureRate >= 8);

  return (
    <AdminShell title="Dashboard" subtitle="Current state only. Every metric links through to the screen where it can be acted on.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          label="Active accounts"
          icon={Building2}
          value={String(activeish.length)}
          to="/admin/subscriptions"
          sub={byTier.map((b) => `${PLAN_LABEL[b.tier]} ${b.count}`).join(" · ")}
        />
        <Metric
          label="MRR"
          icon={DollarSign}
          value={fmtMoney(mrr)}
          to="/admin/subscriptions"
          sub={
            <span className={trend >= 0 ? "text-success" : "text-destructive"}>
              {trend >= 0 ? "▲" : "▼"} {fmtMoney(Math.abs(trend))} vs. last period
            </span>
          }
        />
        <Metric
          label="Deeds processed this period"
          icon={FileText}
          value={deeds.toLocaleString()}
          to="/admin/usage"
          sub={`Top: ${rows.slice(0, 5).map((r) => `${r.code} ${r.deeds}`).join(" · ")}`}
        />
        <Metric
          label="Accounts past due"
          icon={AlertTriangle}
          value={String(pastDue.length)}
          to="/admin/subscriptions"
          sub={`${fmtMoney(pastDue.reduce((s, a) => s + mrrOf(a), 0))} MRR at risk — open filtered list`}
        />
        <Metric
          label="Paid data-API spend"
          icon={Server}
          value={fmtMoney(apiSpend)}
          to="/admin/usage"
          sub={`${rows.reduce((s, r) => s + r.apiCalls, 0).toLocaleString()} billable calls this period`}
        />
        <Metric
          label="Jurisdictions"
          icon={Map}
          value={`${live.length} live / ${beta.length} beta`}
          to="/admin/jurisdictions"
          sub={
            degraded.length ? (
              <span className="text-destructive">
                ⚑ Elevated lookup failures: {degraded.map((d) => `${d.code} ${d.lookupFailureRate}%`).join(", ")}
              </span>
            ) : (
              "All live lookups nominal"
            )
          }
        />
      </div>

      <div className="mt-4">
        <GrowthCharts accounts={accounts} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Card title="Needs attention today" action={<Link to="/admin/subscriptions" search={{ q: "", status: "past_due" }} className="text-xs underline">Subscription management →</Link>}>
          {pastDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past-due accounts.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {pastDue.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.firm}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.id} · {PLAN_LABEL[a.plan]}</p>
                  </div>
                  <StatusPill status="Past due" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Top jurisdictions by volume" action={<Link to="/admin/usage" className="text-xs underline">Usage dashboard →</Link>}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">State</th>
                <th className="pb-2 text-right font-medium">Deeds</th>
                <th className="pb-2 text-right font-medium">API cost</th>
                <th className="pb-2 text-right font-medium">Lookup fail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.slice(0, 5).map((r) => (
                <tr key={r.code}>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2 text-right tabular-nums">{r.deeds}</td>
                  <td className="py-2 text-right tabular-nums">{fmtMoney(r.apiCost)}</td>
                  <td className={`py-2 text-right tabular-nums ${r.failureRate >= 8 ? "text-destructive" : ""}`}>{r.failureRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminShell>
  );
}