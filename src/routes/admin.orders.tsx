import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell, Card, StatusPill, inputCls } from "@/components/admin/AdminShell";
import { formatPlanDisplayPrice, formatPlanIdShort } from "@/lib/billing-plans";
import {
  formatOrderStatus,
  formatTxnType,
  type OrderRow,
  type SubscriptionRow,
  type TransactionRow,
} from "@/lib/billing-ledger";
import { ADMIN_HINT } from "@/lib/admin-store";
import { loadBillingPlansAdmin, loadOrdersAdmin } from "@/lib/admin-billing.functions";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders & payments — Deed Copilot Internal" },
      {
        name: "description",
        content: "Ledger of checkout orders and Stripe transactions, linked to billing_plans.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersAdmin,
});

function fmtWhen(at?: string | null) {
  if (!at) return "—";
  return new Date(at).toLocaleString();
}

function orderPill(status: OrderRow["status"]) {
  if (status === "paid") return "Active";
  if (status === "failed" || status === "canceled") return "Canceled";
  if (status === "refunded" || status === "partially_refunded") return "Past due";
  return "Trial";
}

function OrdersAdmin() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"orders" | "transactions">("orders");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planRows, ledger] = await Promise.all([
        loadBillingPlansAdmin({ data: { token: ADMIN_HINT.password } }),
        loadOrdersAdmin({ data: { token: ADMIN_HINT.password } }),
      ]);
      setPlans(Object.fromEntries(planRows.map((p) => [p.id, p.name])));
      setOrders(ledger.orders);
      setTransactions(ledger.transactions);
      setSubscriptions(ledger.subscriptions);
      setSelected((prev) => {
        if (prev && ledger.orders.some((r) => r.id === prev)) return prev;
        return ledger.orders[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredOrders = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((o) =>
      `${o.email ?? ""} ${o.id} ${o.stripe_checkout_session_id ?? ""} ${plans[o.billing_plan_id] ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [orders, plans, q]);

  const current = useMemo(
    () => orders.find((o) => o.id === selected) ?? null,
    [orders, selected],
  );

  const currentTxns = useMemo(
    () => (current ? transactions.filter((t) => t.order_id === current.id) : []),
    [current, transactions],
  );

  const currentSub = useMemo(() => {
    if (!current) return null;
    return (
      subscriptions.find((s) => s.origin_order_id === current.id) ??
      (current.stripe_subscription_id
        ? subscriptions.find((s) => s.stripe_subscription_id === current.stripe_subscription_id)
        : null) ??
      null
    );
  }, [current, subscriptions]);

  const filteredTxns = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return transactions;
    return transactions.filter((t) =>
      `${t.id} ${t.order_id} ${t.type} ${t.stripe_payment_intent_id ?? ""} ${plans[t.billing_plan_id] ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [transactions, plans, q]);

  return (
    <AdminShell
      title="Orders & payments"
      subtitle="Checkout writes an order against billing_plans. A paid charge opens a subscription for recurring plans; renewals append transactions."
    >
      {error ? (
        <p className="mb-4 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-sm border border-border">
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`px-3 py-1.5 text-xs ${tab === "orders" ? "bg-primary/10 font-medium" : "text-muted-foreground"}`}
          >
            Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("transactions")}
            className={`px-3 py-1.5 text-xs ${tab === "transactions" ? "bg-primary/10 font-medium" : "text-muted-foreground"}`}
          >
            Transactions ({transactions.length})
          </button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === "orders" ? "Email, order id, plan…" : "Payment intent, type, plan…"}
          className={`${inputCls} max-w-sm`}
        />
      </div>

      {tab === "transactions" ? (
        <Card title={`Transactions (${filteredTxns.length})`}>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filteredTxns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions yet. They appear when a checkout is paid or a subscription renews.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 pb-2 font-medium">When</th>
                    <th className="px-3 pb-2 font-medium">Type</th>
                    <th className="px-3 pb-2 font-medium">Plan</th>
                    <th className="px-3 pb-2 font-medium">Amount</th>
                    <th className="px-3 pb-2 font-medium">Status</th>
                    <th className="px-3 pb-2 font-medium">Stripe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTxns.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setSelected(t.order_id);
                        setTab("orders");
                      }}
                      className="cursor-pointer hover:bg-muted"
                    >
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtWhen(t.created_at)}</td>
                      <td className="px-3 py-2.5">{formatTxnType(t.type)}</td>
                      <td className="px-3 py-2.5">{plans[t.billing_plan_id] ?? formatPlanIdShort(t.billing_plan_id)}</td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {t.type === "refund" ? "−" : ""}
                        {formatPlanDisplayPrice(Math.abs(t.amount_cents), t.currency)}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={t.status === "succeeded" ? "Active" : t.status === "failed" ? "Canceled" : "Trial"} />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                        {t.stripe_payment_intent_id ?? t.stripe_invoice_id ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card title={`Orders (${filteredOrders.length})`}>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filteredOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No orders yet. A row is created when someone opens Stripe Checkout.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 pb-2 font-medium">Customer</th>
                      <th className="px-3 pb-2 font-medium">Plan</th>
                      <th className="px-3 pb-2 font-medium">Amount</th>
                      <th className="px-3 pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => setSelected(o.id)}
                        className={`cursor-pointer transition-colors hover:bg-muted ${
                          selected === o.id
                            ? "bg-primary/10 shadow-[inset_2px_0_0_0_var(--color-primary)]"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="font-medium">{o.email ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{fmtWhen(o.created_at)}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div>{plans[o.billing_plan_id] ?? "Plan"}</div>
                          <div className="text-xs text-muted-foreground">
                            {o.kind === "subscription" ? "recurring" : "one-time"}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {formatPlanDisplayPrice(o.amount_cents, o.currency)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusPill status={orderPill(o.status)} />
                          <span className="ml-1 text-xs text-muted-foreground">{formatOrderStatus(o.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {current ? (
            <Card title={plans[current.billing_plan_id] ?? "Order"}>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Order ID</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs">{current.id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Plan</dt>
                  <dd className="mt-0.5">
                    {plans[current.billing_plan_id] ?? "—"}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatPlanIdShort(current.billing_plan_id)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Customer</dt>
                  <dd className="mt-0.5">{current.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Amount</dt>
                  <dd className="mt-0.5 tabular-nums">
                    {formatPlanDisplayPrice(current.amount_cents, current.currency)} · {current.kind}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Stripe checkout session</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs">
                    {current.stripe_checkout_session_id ?? "—"}
                  </dd>
                </div>
              </dl>

              {currentSub ? (
                <div className="mt-4 rounded-sm border border-border bg-muted/40 px-3 py-2.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Subscription
                  </p>
                  <p className="mt-1 text-sm">
                    <StatusPill
                      status={
                        currentSub.status === "active" || currentSub.status === "trialing"
                          ? "Active"
                          : currentSub.status === "past_due"
                            ? "Past due"
                            : "Canceled"
                      }
                    />{" "}
                    <span className="text-muted-foreground">
                      {currentSub.status}
                      {currentSub.current_period_end
                        ? ` · renews ${fmtWhen(currentSub.current_period_end)}`
                        : ""}
                    </span>
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                    {currentSub.stripe_subscription_id}
                  </p>
                </div>
              ) : current.kind === "subscription" ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Recurring order — subscription row appears after the first successful charge.
                </p>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">One-time package — no subscription.</p>
              )}

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Transactions ({currentTxns.length})
                </p>
                {currentTxns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None yet (order still pending or unpaid).</p>
                ) : (
                  <ul className="divide-y divide-border rounded-sm border border-border">
                    {currentTxns.map((t) => (
                      <li key={t.id} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{formatTxnType(t.type)}</p>
                          <p className="text-xs text-muted-foreground">{fmtWhen(t.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="tabular-nums">
                            {formatPlanDisplayPrice(Math.abs(t.amount_cents), t.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">{t.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ) : (
            <Card title="Order">
              <p className="text-sm text-muted-foreground">Select an order to see transactions and subscription.</p>
            </Card>
          )}
        </div>
      )}
    </AdminShell>
  );
}
