import { createServerFn } from "@tanstack/react-start";
import type { BillingPlanRow } from "@/lib/billing-plans";
import { fetchAllBillingPlans } from "@/lib/billing-plans.server";

const ADMIN_TOKEN = "deedadmin";

export type BillingPlanPatch = {
  name?: string;
  description?: string | null;
  amount_cents?: number;
  currency?: string;
  is_recurring?: boolean;
  billing_interval?: string | null;
  active?: boolean;
  sort_order?: number;
};

function guard(token: string) {
  if (token !== ADMIN_TOKEN) throw new Error("Not authorized for the internal console.");
}

async function write(path: string, body: unknown, method: "PATCH" | "POST") {
  const url = process.env["EXT_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key = process.env["EXT_SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Backend credentials are not configured.");
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Backend write failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export const loadBillingPlansAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }): Promise<BillingPlanRow[]> => {
    guard(data.token);
    return fetchAllBillingPlans();
  });

export const saveBillingPlanAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; id: string; patch: BillingPlanPatch }) => input)
  .handler(async ({ data }): Promise<BillingPlanRow> => {
    guard(data.token);

    const patch = { ...data.patch };
    if (patch.is_recurring === false) {
      patch.billing_interval = null;
    }
    if (patch.is_recurring === true && !patch.billing_interval) {
      patch.billing_interval = "month";
    }

    const rows = (await write(
      `billing_plans?id=eq.${encodeURIComponent(data.id)}`,
      patch,
      "PATCH",
    )) as BillingPlanRow[];

    const row = rows[0];
    if (!row) throw new Error(`Plan "${data.id}" was not found.`);
    return row;
  });

export const loadOrdersAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    guard(data.token);
    const { fetchAllOrders, fetchAllTransactions, fetchAllSubscriptionsLedger } = await import(
      "@/lib/billing-ledger.server"
    );
    const [orders, transactions, subscriptions] = await Promise.all([
      fetchAllOrders(),
      fetchAllTransactions(),
      fetchAllSubscriptionsLedger(),
    ]);
    return { orders, transactions, subscriptions };
  });

export type AdminProfileAccount = {
  id: string;
  email: string;
  name: string;
  firm: string;
  createdAt: string;
  updatedAt: string;
  deedCount: number;
  paidDeedCount: number;
  orderCount: number;
  planName: string | null;
  billingKind: "subscription" | "one_time" | null;
  billingStatus: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  periodEnd: string | null;
  lastPaidAt: string | null;
  lastPaidCents: number | null;
};

export const loadProfilesAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }): Promise<AdminProfileAccount[]> => {
    guard(data.token);
    const { fetchAllProfiles, fetchDeedUserRows } = await import("@/lib/profiles.server");
    const { fetchAllOrders, fetchAllSubscriptionsLedger } = await import("@/lib/billing-ledger.server");
    const { fetchAllBillingPlans } = await import("@/lib/billing-plans.server");

    const [profiles, deeds, orders, subscriptions, plans] = await Promise.all([
      fetchAllProfiles(),
      fetchDeedUserRows().catch(() => []),
      fetchAllOrders().catch(() => []),
      fetchAllSubscriptionsLedger().catch(() => []),
      fetchAllBillingPlans().catch(() => []),
    ]);

    const planName = Object.fromEntries(plans.map((p) => [p.id, p.name]));

    const deedByUser = new Map<string, { total: number; paid: number }>();
    for (const d of deeds) {
      if (!d.user_id) continue;
      const cur = deedByUser.get(d.user_id) ?? { total: 0, paid: 0 };
      cur.total += 1;
      if (d.status === "paid") cur.paid += 1;
      deedByUser.set(d.user_id, cur);
    }

    return profiles.map((p) => {
      const email = (p.email ?? "").toLowerCase();
      const subs = subscriptions.filter(
        (s) => s.user_id === p.id || (email && s.email?.toLowerCase() === email),
      );
      const sub =
        subs.find((s) => s.status === "active" || s.status === "trialing") ??
        subs.find(
          (s) =>
            s.status === "past_due" ||
            s.status === "unpaid" ||
            s.status === "incomplete" ||
            s.status === "paused",
        ) ??
        null;
      const userOrders = orders.filter(
        (o) => o.user_id === p.id || (email && o.email?.toLowerCase() === email),
      );
      const lastPaid = userOrders.find((o) => o.status === "paid") ?? null;
      const counts = deedByUser.get(p.id) ?? { total: 0, paid: 0 };

      let billingKind: AdminProfileAccount["billingKind"] = null;
      let billingStatus: string | null = null;
      let plan: string | null = null;
      if (sub) {
        billingKind = "subscription";
        billingStatus = sub.status;
        plan = planName[sub.billing_plan_id] ?? "Firm monthly";
      }

      return {
        id: p.id,
        email: p.email ?? "",
        name: p.name ?? "",
        firm: p.firm ?? "",
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        deedCount: counts.total,
        paidDeedCount: counts.paid,
        orderCount: userOrders.length,
        planName: plan,
        billingKind,
        billingStatus,
        stripeSubscriptionId: sub?.stripe_subscription_id ?? null,
        stripeCustomerId: sub?.stripe_customer_id ?? lastPaid?.stripe_customer_id ?? null,
        periodEnd: sub?.current_period_end ?? null,
        lastPaidAt: lastPaid?.paid_at ?? lastPaid?.created_at ?? null,
        lastPaidCents: lastPaid?.amount_cents ?? null,
      };
    });
  });
