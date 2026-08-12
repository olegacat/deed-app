import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell, Card, ConfirmDialog, Field, StatusPill, inputCls } from "@/components/admin/AdminShell";
import {
  PLAN_LABEL,
  PLAN_PRICE,
  PLAN_QUOTA,
  STATUS_LABEL,
  fmtDate,
  fmtMoney,
  updateAccount,
  useAdminStore,
  type Account,
  type PlanTier,
} from "@/lib/admin-store";

export const Route = createFileRoute("/admin/accounts")({
  head: () => ({
    meta: [
      { title: "Account Lookup — Deed Copilot Internal" },
      { name: "description", content: "Search a firm, user email or account ID and see plan, quota, payment status and overrides on one screen." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Account Lookup — Deed Copilot Internal" },
      { property: "og:description", content: "Internal single-account support view for Deed Copilot." },
    ],
  }),
  component: Accounts,
});

function Accounts() {
  const { accounts } = useAdminStore();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const results = q.trim()
    ? accounts.filter((a) => `${a.firm} ${a.email} ${a.id}`.toLowerCase().includes(q.trim().toLowerCase()))
    : accounts;

  useEffect(() => {
    if (!openId && results.length > 0) setOpenId(results[0]?.id ?? null);
  }, [results, openId]);

  const selected = accounts.find((a) => a.id === openId) ?? null;

  return (
    <AdminShell title="Account lookup" subtitle="For answering one customer's question. For the daily ops list use Subscriptions.">
      <div className={`grid items-start gap-3 ${selected ? "xl:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
      <Card title="Search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Firm name, user email or account ID…"
          className={inputCls}
        />
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 font-medium">Firm</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Account ID</th>
              <th className="pb-2 font-medium">Plan</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((a) => (
              <tr
                key={a.id}
                onClick={() => setOpenId(a.id)}
                className={`cursor-pointer transition-colors hover:bg-muted ${
                  openId === a.id ? "bg-primary/10 shadow-[inset_2px_0_0_0_var(--color-primary)]" : ""
                }`}
              >
                <td className="py-2 font-medium">{a.firm}</td>
                <td className="py-2 text-muted-foreground">{a.email}</td>
                <td className="py-2 tabular-nums">{a.id}</td>
                <td className="py-2">{PLAN_LABEL[a.plan]}</td>
                <td className="py-2"><StatusPill status={STATUS_LABEL[a.status]} /></td>
              </tr>
            ))}
            {results.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No matching account.</td></tr>
            ) : null}
          </tbody>
        </table>
        {!selected ? (
          <p className="mt-3 text-xs text-muted-foreground">Select a row to open the account detail panel.</p>
        ) : null}
      </Card>

      {selected ? (
        <div className="xl:sticky xl:top-28">
          <AccountDetail a={selected} onClose={() => setOpenId(null)} />
        </div>
      ) : null}
      </div>
    </AdminShell>
  );
}

function AccountDetail({ a, onClose }: { a: Account; onClose: () => void }) {
  const [overrideOpen, setOverrideOpen] = useState(false);
  const quota = PLAN_QUOTA[a.plan];

  return (
    <Card
      title={a.firm}
      action={
        <button
          onClick={onClose}
          aria-label="Close account detail"
          className="rounded-sm border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          ✕
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <button onClick={() => setOverrideOpen(true)} className="rounded-sm border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
          Manual override
        </button>
        <Link to="/admin/subscriptions" search={{ q: a.firm, status: "all" }} className="rounded-sm bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground">
          Manage subscription →
        </Link>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Plan tier & status</dt>
          <dd className="mt-1 flex items-center gap-2">
            {PLAN_LABEL[a.plan]} <StatusPill status={STATUS_LABEL[a.status]} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Deeds this billing period</dt>
          <dd className="mt-1 tabular-nums">
            {a.deedsUsed} / {quota}{" "}
            {a.deedsUsed > quota ? <span className="text-destructive">over quota</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Last payment</dt>
          <dd className={`mt-1 ${a.lastPayment.result === "failed" ? "text-destructive" : ""}`}>
            {a.lastPayment.result === "failed" ? "Failed" : "Success"} · {fmtMoney(a.lastPayment.amount)} · {fmtDate(a.lastPayment.date)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Next renewal · MRR</dt>
          <dd className="mt-1">{fmtDate(a.renewalDate)} · {fmtMoney(PLAN_PRICE[a.plan])}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Account ID · Stripe subscription</dt>
          <dd className="mt-1 break-all font-mono text-xs">{a.id} · {a.stripeSubId}</dd>
        </div>
        {a.discountNote ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Active override</dt>
            <dd className="mt-1">{a.discountNote}{a.compUntil ? ` (until ${fmtDate(a.compUntil)})` : ""}</dd>
          </div>
        ) : null}
      </dl>

      {a.notes.length ? (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Admin notes (audit trail)</p>
          <ul className="space-y-1.5 text-xs">
            {a.notes.map((n, i) => (
              <li key={i} className="rounded-sm bg-muted/50 px-2 py-1.5">
                <span className="text-muted-foreground">{new Date(n.at).toLocaleString()} · {n.by}</span>
                <p className="mt-0.5">{n.text}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {overrideOpen ? <OverrideForm a={a} onClose={() => setOverrideOpen(false)} /> : null}
    </Card>
  );
}

function OverrideForm({ a, onClose }: { a: Account; onClose: () => void }) {
  const [plan, setPlan] = useState<PlanTier>(a.plan);
  const [discount, setDiscount] = useState("");
  const [compDays, setCompDays] = useState("0");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);

  const days = Number(compDays) || 0;

  function apply() {
    const parts: string[] = [];
    if (plan !== a.plan) parts.push(`plan ${PLAN_LABEL[a.plan]} → ${PLAN_LABEL[plan]}`);
    if (discount.trim()) parts.push(`discount: ${discount.trim()}`);
    if (days > 0) parts.push(`comp period ${days} days`);
    const patch: Partial<Account> = { plan };
    const nextDiscount = discount.trim() || (days > 0 ? `${days}-day comp period` : a.discountNote);
    if (nextDiscount) patch.discountNote = nextDiscount;
    if (days > 0) patch.compUntil = new Date(Date.now() + days * 86_400_000).toISOString();
    updateAccount(a.id, patch, `Manual override — ${parts.join("; ") || "no billing change"}. Reason: ${note.trim()}`);
    setConfirm(false);
    onClose();
  }

  return (
    <div className="mt-4 rounded-sm border border-warning/50 bg-warning/10 p-4">
      <p className="text-sm font-semibold">Manual plan override</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Applies outside Stripe. The note is required and stored as the audit trail.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Plan tier">
          <select value={plan} onChange={(e) => setPlan(e.target.value as PlanTier)} className={inputCls}>
            {(["starter", "professional", "firm"] as PlanTier[]).map((p) => (
              <option key={p} value={p}>{PLAN_LABEL[p]} — {fmtMoney(PLAN_PRICE[p])}/mo</option>
            ))}
          </select>
        </Field>
        <Field label="Temporary discount (e.g. 50% for 3 months)">
          <input value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Comp period (days)">
          <input value={compDays} onChange={(e) => setCompDays(e.target.value)} inputMode="numeric" className={inputCls} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Reason (required)">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} placeholder="Why is this override being applied?" />
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setConfirm(true)}
          disabled={!note.trim()}
          className="rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Review & apply
        </button>
        <button onClick={onClose} className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
        {!note.trim() ? <span className="self-center text-xs text-muted-foreground">A reason is required.</span> : null}
      </div>

      <ConfirmDialog
        open={confirm}
        title="Apply manual override?"
        confirmLabel="Apply override"
        onCancel={() => setConfirm(false)}
        onConfirm={apply}
        body={
          <>
            <p>This changes real billing state for <strong>{a.firm}</strong>.</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>Plan: {PLAN_LABEL[a.plan]} → {PLAN_LABEL[plan]}</li>
              <li>Discount: {discount.trim() || "none"}</li>
              <li>Comp period: {days > 0 ? `${days} days` : "none"}</li>
            </ul>
            <p className="text-sm">Note: {note}</p>
          </>
        }
      />
    </div>
  );
}