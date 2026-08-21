import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell, Card, Field, StatusPill, inputCls } from "@/components/admin/AdminShell";
import { formatPlanDisplayPrice, formatPlanIdShort, planCadence, type BillingPlanRow } from "@/lib/billing-plans";
import { ADMIN_HINT } from "@/lib/admin-store";
import { loadBillingPlansAdmin, saveBillingPlanAdmin } from "@/lib/admin-billing.functions";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({
    meta: [
      { title: "Checkout Plans — Deed Copilot Internal" },
      {
        name: "description",
        content: "Edit checkout pricing in billing_plans — names, amounts, recurring flag. Changes apply immediately.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPlansAdmin,
});

function fmtUpdated(at?: string) {
  if (!at) return "—";
  return new Date(at).toLocaleString();
}

function CheckoutPlansAdmin() {
  const [plans, setPlans] = useState<BillingPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await loadBillingPlansAdmin({ data: { token: ADMIN_HINT.password } });
      setPlans(rows);
      setSelected((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev;
        return rows[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load checkout plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const current = useMemo(
    () => plans.find((p) => p.id === selected) ?? null,
    [plans, selected],
  );

  return (
    <AdminShell
      title="Checkout plan editor"
      subtitle="Edits billing_plans in Supabase — checkout and Stripe charges update on the next session (no deploy)."
    >
      {error ? (
        <p className="mb-4 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card title={`Plans (${plans.length})`}>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rows in billing_plans — run the SQL seed in Supabase first.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 pb-2 font-medium">Plan</th>
                    <th className="px-3 pb-2 font-medium">Price</th>
                    <th className="px-3 pb-2 font-medium">Billing</th>
                    <th className="px-3 pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plans.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p.id)}
                      className={`cursor-pointer transition-colors hover:bg-muted ${
                        selected === p.id
                          ? "bg-primary/10 shadow-[inset_2px_0_0_0_var(--color-primary)]"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {formatPlanIdShort(p.id)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatPlanDisplayPrice(p.amount_cents, p.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{planCadence(p)}</td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={p.active ? "Active" : "Inactive"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {current ? (
          <PlanEditor
            key={current.id}
            plan={current}
            onSaved={(row) => {
              setPlans((prev) => prev.map((p) => (p.id === row.id ? row : p)));
            }}
          />
        ) : (
          <Card title="Edit plan">
            <p className="text-sm text-muted-foreground">Select a plan on the left to edit pricing.</p>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}

function PlanEditor({
  plan,
  onSaved,
}: {
  plan: BillingPlanRow;
  onSaved: (row: BillingPlanRow) => void;
}) {
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [priceDollars, setPriceDollars] = useState(String(plan.amount_cents / 100));
  const [isRecurring, setIsRecurring] = useState(plan.is_recurring);
  const [billingInterval, setBillingInterval] = useState(plan.billing_interval ?? "month");
  const [active, setActive] = useState(plan.active);
  const [sortOrder, setSortOrder] = useState(String(plan.sort_order ?? 0));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const amountCents = Math.round(Number(priceDollars) * 100);
  const priceValid = Number.isFinite(amountCents) && amountCents >= 0;

  const dirty =
    name !== plan.name ||
    description !== (plan.description ?? "") ||
    amountCents !== plan.amount_cents ||
    isRecurring !== plan.is_recurring ||
    (isRecurring ? billingInterval : null) !== (plan.is_recurring ? plan.billing_interval : null) ||
    active !== plan.active ||
    Number(sortOrder) !== (plan.sort_order ?? 0);

  async function save() {
    if (!priceValid) {
      setSaveError("Enter a valid price.");
      return;
    }
    if (isRecurring && !billingInterval) {
      setSaveError("Recurring plans need a billing interval.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const row = await saveBillingPlanAdmin({
        data: {
          token: ADMIN_HINT.password,
          id: plan.id,
          patch: {
            name: name.trim(),
            description: description.trim() || null,
            amount_cents: amountCents,
            is_recurring: isRecurring,
            billing_interval: isRecurring ? billingInterval : null,
            active,
            sort_order: Number(sortOrder) || 0,
          },
        },
      });
      onSaved(row);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title={plan.name}
      action={
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Offered at checkout</span>
          <button
            type="button"
            aria-pressed={active}
            onClick={() => setActive(!active)}
            className={`h-5 w-9 rounded-full transition-colors ${active ? "bg-success" : "bg-muted-foreground/40"}`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-card transition-transform ${active ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </button>
          <StatusPill status={active ? "Active" : "Inactive"} />
        </label>
      }
    >
      <p className="mb-4 text-xs text-muted-foreground">
        Plan ID <span className="font-mono text-foreground">{plan.id}</span> · last updated{" "}
        {fmtUpdated(plan.updated_at)}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Display name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Price (USD)">
          <input
            inputMode="decimal"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value.replace(/[^0-9.]/g, ""))}
            className={inputCls}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Stored as {priceValid ? `${amountCents} cents` : "—"} · shown as{" "}
            {priceValid ? formatPlanDisplayPrice(amountCents) : "—"} at checkout
          </p>
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Description (checkout blurb)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Billing type">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsRecurring(false)}
              className={`flex-1 rounded-sm border px-3 py-2 text-sm ${!isRecurring ? "border-primary bg-primary/10 font-medium" : "border-border"}`}
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => setIsRecurring(true)}
              className={`flex-1 rounded-sm border px-3 py-2 text-sm ${isRecurring ? "border-primary bg-primary/10 font-medium" : "border-border"}`}
            >
              Recurring
            </button>
          </div>
        </Field>
        {isRecurring ? (
          <Field label="Interval">
            <select
              value={billingInterval}
              onChange={(e) => setBillingInterval(e.target.value)}
              className={inputCls}
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
              <option value="week">Weekly</option>
              <option value="day">Daily</option>
            </select>
          </Field>
        ) : (
          <Field label="Interval">
            <input value="—" readOnly className={`${inputCls} bg-muted text-muted-foreground`} />
          </Field>
        )}
        <Field label="Sort order">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Currency">
          <input value={plan.currency.toUpperCase()} readOnly className={`${inputCls} bg-muted`} />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved ? (
          <span className="text-xs text-success">Saved — live at checkout immediately.</span>
        ) : null}
        {dirty && !saved && !saving ? (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        ) : null}
        {saveError ? <span className="text-xs text-destructive">{saveError}</span> : null}
      </div>
    </Card>
  );
}
