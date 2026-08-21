import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell, Card, ConfirmDialog, StatusPill, inputCls } from "@/components/admin/AdminShell";
import {
  PLAN_LABEL,
  PLAN_PRICE,
  STATUS_LABEL,
  fmtDate,
  fmtMoney,
  mrrOf,
  updateAccount,
  useAdminStore,
  type Account,
  type PlanTier,
  type SubStatus,
} from "@/lib/admin-store";

export const Route = createFileRoute("/admin/subscriptions")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search['q'] === "string" ? (search['q'] as string) : "",
    status: typeof search['status'] === "string" ? (search['status'] as string) : "all",
  }),
  head: () => ({
    meta: [
      { title: "Subscription Management — Deed Copilot Internal" },
      { name: "description", content: "Operational list of every subscription: status, renewal date, MRR contribution and Stripe billing actions." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Subscription Management — Deed Copilot Internal" },
      { property: "og:description", content: "Daily ops view of every Deed Copilot subscription." },
    ],
  }),
  component: Subscriptions,
});

type ActionKind = "plan" | "cancel" | "pause" | "resume" | "retry";
type Pending = { kind: ActionKind; account: Account };

function Subscriptions() {
  const { accounts } = useAdminStore();
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q);
  const [status, setStatus] = useState<string>(search.status);
  const [sort, setSort] = useState<"renewal" | "mrr">("renewal");
  const [pending, setPending] = useState<Pending | null>(null);
  const [plan, setPlan] = useState<PlanTier>("professional");
  const [cancelMode, setCancelMode] = useState<"period_end" | "immediate">("period_end");

  const rows = useMemo(() => {
    return accounts
      .filter((a) => (status === "all" ? true : a.status === status))
      .filter((a) => `${a.firm} ${a.email} ${a.id} ${a.stripeSubId}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) =>
        sort === "mrr" ? mrrOf(b) - mrrOf(a) : new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(),
      );
  }, [accounts, q, status, sort]);

  const pastDue = accounts.filter((a) => a.status === "past_due");
  const atRisk = pastDue.reduce((s, a) => s + mrrOf(a), 0);

  function open(kind: ActionKind, account: Account) {
    setPlan(account.plan);
    setCancelMode("period_end");
    setPending({ kind, account });
  }

  function confirmAction() {
    if (!pending) return;
    const { kind, account } = pending;
    if (kind === "plan") {
      updateAccount(account.id, { plan }, `Plan changed ${PLAN_LABEL[account.plan]} → ${PLAN_LABEL[plan]} from subscription management`);
    } else if (kind === "cancel") {
      if (cancelMode === "immediate") {
        updateAccount(account.id, { status: "canceled" as SubStatus, cancelAtPeriodEnd: false }, "Canceled immediately (Stripe: cancel now, no proration credit issued)");
      } else {
        updateAccount(account.id, { cancelAtPeriodEnd: true }, `Set to cancel at period end (${fmtDate(account.renewalDate)}) — remains active until then`);
      }
    } else if (kind === "pause") {
      updateAccount(account.id, { status: "paused" as SubStatus }, "Subscription paused — billing suspended, no invoices generated");
    } else if (kind === "resume") {
      updateAccount(account.id, { status: "active" as SubStatus }, "Subscription resumed — billing restarts on next cycle");
    } else if (kind === "retry") {
      updateAccount(
        account.id,
        { status: "active" as SubStatus, lastPayment: { result: "success", date: new Date().toISOString(), amount: PLAN_PRICE[account.plan] } },
        "Retried failed payment — charge succeeded",
      );
    }
    setPending(null);
  }

  return (
    <AdminShell title="Customer subscription management" subtitle="Every subscription in one operational list. All row actions require confirmation.">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Subscriptions</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{accounts.length}</p>
        </div>
        <button onClick={() => setStatus("past_due")} className="rounded-sm border border-destructive/40 bg-destructive/10 p-4 text-left">
          <p className="text-xs uppercase tracking-wider text-destructive">Past due right now</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">{pastDue.length}</p>
          <p className="text-xs text-destructive">Click to filter</p>
        </button>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">MRR at risk</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{fmtMoney(atRisk)}</p>
        </div>
      </div>

      <div className="mt-3">
        <Card
          title={`Subscriptions (${rows.length})`}
          action={
            <div className="flex flex-wrap gap-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-sm border border-input bg-background px-2 py-1 text-xs">
                <option value="all">All statuses</option>
                {(["active", "trial", "past_due", "paused", "canceled"] as SubStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-sm border border-input bg-background px-2 py-1 text-xs">
                <option value="renewal">Sort: renewal date</option>
                <option value="mrr">Sort: MRR</option>
              </select>
            </div>
          }
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by firm, email or Stripe ID…" className={inputCls} />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 pb-2 font-medium">Firm</th>
                  <th className="px-3 pb-2 font-medium">Plan</th>
                  <th className="px-3 pb-2 font-medium">Status</th>
                  <th className="px-3 pb-2 font-medium">Next renewal</th>
                  <th className="px-3 pb-2 text-right font-medium">MRR</th>
                  <th className="px-3 pb-2 font-medium">Stripe sub ID</th>
                  <th className="px-3 pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium">{a.firm}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </td>
                    <td className="px-3 py-2">{PLAN_LABEL[a.plan]}</td>
                    <td className="px-3 py-2">
                      <StatusPill status={STATUS_LABEL[a.status]} />
                      {a.cancelAtPeriodEnd ? <p className="mt-1 text-[11px] text-muted-foreground">cancels at period end</p> : null}
                    </td>
                    <td className="px-3 py-2">{fmtDate(a.renewalDate)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(mrrOf(a))}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.stripeSubId}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => open("plan", a)} className="rounded-sm border border-border px-2 py-1 text-[11px] hover:bg-muted">Change plan</button>
                        {a.status !== "canceled" ? (
                          <button onClick={() => open("cancel", a)} className="rounded-sm border border-border px-2 py-1 text-[11px] hover:bg-muted">Cancel</button>
                        ) : null}
                        {a.status === "paused" ? (
                          <button onClick={() => open("resume", a)} className="rounded-sm border border-border px-2 py-1 text-[11px] hover:bg-muted">Resume</button>
                        ) : a.status === "active" || a.status === "trial" ? (
                          <button onClick={() => open("pause", a)} className="rounded-sm border border-border px-2 py-1 text-[11px] hover:bg-muted">Pause</button>
                        ) : null}
                        {a.status === "past_due" ? (
                          <button onClick={() => open("retry", a)} className="rounded-sm border border-destructive/50 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10">Retry payment</button>
                        ) : null}
                        <a
                          href={`https://dashboard.stripe.com/customers/${a.stripeCustomerId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-sm border border-border px-2 py-1 text-[11px] hover:bg-muted"
                        >
                          Stripe ↗
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">No subscriptions match this filter.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pending}
        title={
          pending?.kind === "plan" ? "Change plan tier?"
          : pending?.kind === "cancel" ? "Cancel subscription?"
          : pending?.kind === "pause" ? "Pause subscription?"
          : pending?.kind === "resume" ? "Resume subscription?"
          : "Retry failed payment?"
        }
        confirmLabel="Yes, apply"
        onCancel={() => setPending(null)}
        onConfirm={confirmAction}
        body={
          pending ? (
            <>
              <p>
                This touches real billing state for <strong>{pending.account.firm}</strong> ({pending.account.stripeSubId}).
              </p>
              {pending.kind === "plan" ? (
                <select value={plan} onChange={(e) => setPlan(e.target.value as PlanTier)} className={inputCls}>
                  {(["starter", "professional", "firm"] as PlanTier[]).map((p) => (
                    <option key={p} value={p}>{PLAN_LABEL[p]} — {fmtMoney(PLAN_PRICE[p])}/mo</option>
                  ))}
                </select>
              ) : null}
              {pending.kind === "cancel" ? (
                <div className="space-y-2 text-sm">
                  <label className="flex items-start gap-2">
                    <input type="radio" checked={cancelMode === "period_end"} onChange={() => setCancelMode("period_end")} className="mt-1" />
                    <span>
                      <strong>At period end</strong> — stays active until {fmtDate(pending.account.renewalDate)}, then does not renew (Stripe
                      <code className="mx-1">cancel_at_period_end</code>).
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="radio" checked={cancelMode === "immediate"} onChange={() => setCancelMode("immediate")} className="mt-1" />
                    <span>
                      <strong>Immediately</strong> — access ends now; Stripe does not prorate a refund unless you issue one manually.
                    </span>
                  </label>
                </div>
              ) : null}
              {pending.kind === "retry" ? (
                <p className="text-sm text-muted-foreground">
                  Re-attempts the latest open invoice of {fmtMoney(PLAN_PRICE[pending.account.plan])} against the card on file.
                </p>
              ) : null}
              {pending.kind === "pause" ? (
                <p className="text-sm text-muted-foreground">Billing is suspended; no invoices are generated until resumed.</p>
              ) : null}
            </>
          ) : null
        }
      />
    </AdminShell>
  );
}