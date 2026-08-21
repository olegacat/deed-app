import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell, Card, StatusPill, inputCls } from "@/components/admin/AdminShell";
import { formatPlanDisplayPrice } from "@/lib/billing-plans";
import { ADMIN_HINT } from "@/lib/admin-store";
import { loadProfilesAdmin, type AdminProfileAccount } from "@/lib/admin-billing.functions";

export const Route = createFileRoute("/admin/accounts")({
  head: () => ({
    meta: [
      { title: "Account Lookup — Deed Copilot Internal" },
      {
        name: "description",
        content: "Customer accounts from profiles: email, firm, plan and deed packages.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Account Lookup — Deed Copilot Internal" },
      { property: "og:description", content: "Internal lookup of Deed Copilot profiles." },
    ],
  }),
  component: Accounts,
});

function fmtWhen(at?: string | null) {
  if (!at) return "—";
  return new Date(at).toLocaleString();
}

function planLabel(a: AdminProfileAccount): string {
  if (a.billingKind === "subscription" && a.planName) return a.planName;
  return "trial";
}

function isAwaitingPayment(a: AdminProfileAccount): boolean {
  if (a.billingKind !== "subscription") return false;
  return (
    a.billingStatus === "past_due" ||
    a.billingStatus === "unpaid" ||
    a.billingStatus === "incomplete" ||
    a.billingStatus === "paused"
  );
}

function billingPill(a: AdminProfileAccount): string {
  if (isAwaitingPayment(a)) return "awaiting payment";
  if (a.billingKind === "subscription" && a.billingStatus === "active") return "Active";
  if (a.billingKind === "subscription" && a.billingStatus === "trialing") return "Trial";
  if (planLabel(a) === "trial") return "Trial";
  return "—";
}

function Accounts() {
  const [accounts, setAccounts] = useState<AdminProfileAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await loadProfilesAdmin({ data: { token: ADMIN_HINT.password } });
      setAccounts(rows);
      setOpenId((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev;
        return rows[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profiles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return accounts;
    return accounts.filter((a) =>
      `${a.firm} ${a.name} ${a.email} ${a.id} ${a.planName ?? ""}`.toLowerCase().includes(needle),
    );
  }, [accounts, q]);

  const selected = accounts.find((a) => a.id === openId) ?? null;

  return (
    <AdminShell
      title="Account lookup"
      subtitle="Rows from public.profiles — every signed-up user, with billing from orders / subscriptions."
    >
      {error ? (
        <p className="mb-4 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className={`grid items-start gap-3 ${selected ? "xl:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
        <Card
          title={loading ? "Search" : `Search (${results.length})`}
          action={
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-sm border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              Refresh
            </button>
          }
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, firm, email or profile ID…"
            className={inputCls}
          />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 pb-2 font-medium">Name</th>
                  <th className="px-3 pb-2 font-medium">Email</th>
                  <th className="px-3 pb-2 font-medium">Firm</th>
                  <th className="px-3 pb-2 font-medium">Plan</th>
                  <th className="px-3 pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                      Loading profiles…
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                      No matching profile.
                    </td>
                  </tr>
                ) : (
                  results.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setOpenId(a.id)}
                      className={`cursor-pointer transition-colors hover:bg-muted ${
                        openId === a.id ? "bg-primary/10 shadow-[inset_2px_0_0_0_var(--color-primary)]" : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-medium">{a.name || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.email || "—"}</td>
                      <td className="px-3 py-2">{a.firm || "—"}</td>
                      <td className="px-3 py-2">{planLabel(a)}</td>
                      <td className="px-3 py-2">
                        <StatusPill status={billingPill(a)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

function AccountDetail({ a, onClose }: { a: AdminProfileAccount; onClose: () => void }) {
  return (
    <Card
      title={a.firm || a.name || a.email || "Profile"}
      action={
        <button
          type="button"
          onClick={onClose}
          aria-label="Close account detail"
          className="rounded-sm border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          ✕
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Link
          to="/admin/orders"
          className="rounded-sm bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Orders & payments →
        </Link>
      </div>

      <dl className="grid gap-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Name</dt>
          <dd className="mt-1">{a.name || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Email</dt>
          <dd className="mt-1 break-all">{a.email || "—"}</dd>
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Plan: </span>
            {planLabel(a)}
          </p>
          {isAwaitingPayment(a) ? (
            <p className="mt-1 text-sm text-destructive">awaiting payment</p>
          ) : null}
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Deed packages</dt>
          <dd className="mt-1 tabular-nums">
            {a.paidDeedCount} paid · {a.deedCount} total
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Orders</dt>
          <dd className="mt-1 tabular-nums">{a.orderCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Last payment</dt>
          <dd className="mt-1">
            {a.lastPaidAt
              ? `${a.lastPaidCents != null ? formatPlanDisplayPrice(a.lastPaidCents) : "—"} · ${fmtWhen(a.lastPaidAt)}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Renewal</dt>
          <dd className="mt-1">{fmtWhen(a.periodEnd)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Profile ID</dt>
          <dd className="mt-1 break-all font-mono text-xs">{a.id}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Stripe</dt>
          <dd className="mt-1 break-all font-mono text-xs">
            {a.stripeCustomerId || a.stripeSubscriptionId
              ? [a.stripeCustomerId, a.stripeSubscriptionId].filter(Boolean).join(" · ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Created</dt>
          <dd className="mt-1">{fmtWhen(a.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Updated</dt>
          <dd className="mt-1">{fmtWhen(a.updatedAt)}</dd>
        </div>
      </dl>
    </Card>
  );
}
