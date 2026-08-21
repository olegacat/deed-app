/** Orders / transactions / subscriptions via Supabase REST (service role). */

import { supabaseRestConfig } from "@/lib/billing-plans.server";
import type {
  OrderKind,
  OrderRow,
  OrderStatus,
  SubscriptionRow,
  TransactionRow,
  TransactionStatus,
  TransactionType,
} from "@/lib/billing-ledger";

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = supabaseRestConfig();
  if (!cfg) throw new Error("Supabase service credentials are not configured.");
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Billing ledger request failed (${res.status}): ${await res.text()}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function ledgerConfigured(): boolean {
  return supabaseRestConfig() !== null;
}

export async function insertPendingOrder(input: {
  billingPlanId: string;
  kind: OrderKind;
  amountCents: number;
  currency: string;
  email?: string;
  userId?: string;
  stripeCheckoutSessionId: string;
  stripeCustomerId?: string;
}): Promise<OrderRow | null> {
  if (!ledgerConfigured()) return null;

  try {
    const rows = await rest<OrderRow[]>("orders", {
      method: "POST",
      body: JSON.stringify({
        billing_plan_id: input.billingPlanId,
        kind: input.kind,
        status: "pending",
        amount_cents: input.amountCents,
        currency: input.currency,
        email: input.email ?? null,
        user_id: input.userId ?? null,
        stripe_checkout_session_id: input.stripeCheckoutSessionId,
        stripe_customer_id: input.stripeCustomerId ?? null,
      }),
    });
    return rows[0] ?? null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("23505") || msg.toLowerCase().includes("duplicate")) {
      return fetchOrderBySessionId(input.stripeCheckoutSessionId);
    }
    console.error("[billing-ledger] insertPendingOrder", e);
    return null;
  }
}

export async function fetchOrderBySessionId(sessionId: string): Promise<OrderRow | null> {
  if (!ledgerConfigured()) return null;
  const rows = await rest<OrderRow[]>(
    `orders?stripe_checkout_session_id=eq.${encodeURIComponent(sessionId)}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

export async function fetchOrderByStripeSubscriptionId(
  stripeSubscriptionId: string,
): Promise<OrderRow | null> {
  const rows = await rest<OrderRow[]>(
    `orders?stripe_subscription_id=eq.${encodeURIComponent(stripeSubscriptionId)}&select=*&order=created_at.desc&limit=1`,
  );
  return rows[0] ?? null;
}

export async function fetchAllOrders(): Promise<OrderRow[]> {
  return rest<OrderRow[]>("orders?select=*&order=created_at.desc&limit=500");
}

export async function fetchTransactionsForOrder(orderId: string): Promise<TransactionRow[]> {
  return rest<TransactionRow[]>(
    `transactions?order_id=eq.${encodeURIComponent(orderId)}&select=*&order=created_at.desc`,
  );
}

export async function fetchAllTransactions(): Promise<TransactionRow[]> {
  return rest<TransactionRow[]>("transactions?select=*&order=created_at.desc&limit=500");
}

export async function fetchSubscriptionForOrder(orderId: string): Promise<SubscriptionRow | null> {
  const rows = await rest<SubscriptionRow[]>(
    `subscriptions?origin_order_id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`,
  );
  if (rows[0]) return rows[0];
  return null;
}

export async function fetchSubscriptionByStripeId(
  stripeSubscriptionId: string,
): Promise<SubscriptionRow | null> {
  const rows = await rest<SubscriptionRow[]>(
    `subscriptions?stripe_subscription_id=eq.${encodeURIComponent(stripeSubscriptionId)}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

export async function fetchAllSubscriptionsLedger(): Promise<SubscriptionRow[]> {
  return rest<SubscriptionRow[]>("subscriptions?select=*&order=updated_at.desc&limit=500");
}

async function patchOrder(id: string, patch: Record<string, unknown>): Promise<OrderRow | null> {
  const rows = await rest<OrderRow[]>(`orders?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return rows[0] ?? null;
}

export type FulfillCheckoutInput = {
  stripeCheckoutSessionId: string;
  paymentStatus: "paid" | "unpaid" | "no_payment_required" | string;
  sessionStatus?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  customerId?: string | null;
  paymentIntentId?: string | null;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  chargeId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  eventId?: string | null;
};

export async function fulfillPaidCheckout(input: FulfillCheckoutInput): Promise<OrderRow | null> {
  if (!ledgerConfigured()) return null;

  const order = await fetchOrderBySessionId(input.stripeCheckoutSessionId);
  if (!order) {
    console.error("[billing-ledger] no order for session", input.stripeCheckoutSessionId);
    return null;
  }

  const paid =
    input.paymentStatus === "paid" ||
    input.paymentStatus === "no_payment_required" ||
    input.sessionStatus === "complete";

  if (!paid) {
    if (input.sessionStatus === "expired") {
      await patchOrder(order.id, { status: "canceled" satisfies OrderStatus });
    }
    return order;
  }

  if (order.status !== "paid") {
    await patchOrder(order.id, {
      status: "paid" satisfies OrderStatus,
      paid_at: new Date().toISOString(),
      stripe_customer_id: input.customerId ?? order.stripe_customer_id,
      stripe_payment_intent_id: input.paymentIntentId ?? order.stripe_payment_intent_id,
      stripe_subscription_id: input.subscriptionId ?? order.stripe_subscription_id,
      ...(typeof input.amountCents === "number" ? { amount_cents: input.amountCents } : {}),
    });
  }

  let subscription: SubscriptionRow | null = null;
  if (order.kind === "subscription" && input.subscriptionId) {
    subscription = await upsertSubscription({
      billingPlanId: order.billing_plan_id,
      originOrderId: order.id,
      userId: order.user_id,
      email: order.email,
      stripeSubscriptionId: input.subscriptionId,
      stripeCustomerId: input.customerId ?? order.stripe_customer_id,
      status: "active",
      periodStart: input.periodStart ?? null,
      periodEnd: input.periodEnd ?? null,
    });
  }

  await insertTransaction({
    orderId: order.id,
    billingPlanId: order.billing_plan_id,
    subscriptionId: subscription?.id ?? null,
    type: "charge",
    status: "succeeded",
    amountCents: input.amountCents ?? order.amount_cents,
    currency: (input.currency ?? order.currency).toLowerCase(),
    stripePaymentIntentId: input.paymentIntentId ?? null,
    stripeChargeId: input.chargeId ?? null,
    stripeInvoiceId: input.invoiceId ?? null,
    stripeEventId: input.eventId ?? null,
  });

  return (await fetchOrderBySessionId(input.stripeCheckoutSessionId)) ?? order;
}

export async function recordRenewal(input: {
  stripeSubscriptionId: string;
  amountCents: number;
  currency: string;
  status: TransactionStatus;
  type?: TransactionType;
  paymentIntentId?: string | null;
  invoiceId?: string | null;
  chargeId?: string | null;
  customerId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  eventId?: string | null;
}): Promise<void> {
  if (!ledgerConfigured()) return;

  const sub = await fetchSubscriptionByStripeId(input.stripeSubscriptionId);
  const order =
    (sub?.origin_order_id
      ? (await rest<OrderRow[]>(`orders?id=eq.${encodeURIComponent(sub.origin_order_id)}&select=*&limit=1`))[0]
      : null) ?? (await fetchOrderByStripeSubscriptionId(input.stripeSubscriptionId));

  if (!order) {
    console.error("[billing-ledger] no order for subscription", input.stripeSubscriptionId);
    return;
  }

  const subscription =
    sub ??
    (await upsertSubscription({
      billingPlanId: order.billing_plan_id,
      originOrderId: order.id,
      userId: order.user_id,
      email: order.email,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.customerId ?? order.stripe_customer_id,
      status: input.status === "succeeded" ? "active" : "past_due",
      periodStart: input.periodStart ?? null,
      periodEnd: input.periodEnd ?? null,
    }));

  if (subscription && input.status === "succeeded") {
    await rest<SubscriptionRow[]>(
      `subscriptions?id=eq.${encodeURIComponent(subscription.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "active",
          current_period_start: input.periodStart ?? subscription.current_period_start,
          current_period_end: input.periodEnd ?? subscription.current_period_end,
        }),
      },
    );
  }

  await insertTransaction({
    orderId: order.id,
    billingPlanId: order.billing_plan_id,
    subscriptionId: subscription?.id ?? null,
    type: input.type ?? "renewal",
    status: input.status,
    amountCents: input.amountCents,
    currency: input.currency.toLowerCase(),
    stripePaymentIntentId: input.paymentIntentId ?? null,
    stripeChargeId: input.chargeId ?? null,
    stripeInvoiceId: input.invoiceId ?? null,
    stripeEventId: input.eventId ?? null,
  });
}

export async function syncSubscriptionFromStripe(input: {
  stripeSubscriptionId: string;
  status: SubscriptionRow["status"];
  customerId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
}): Promise<void> {
  if (!ledgerConfigured()) return;
  const existing = await fetchSubscriptionByStripeId(input.stripeSubscriptionId);
  if (!existing) return;
  await rest<SubscriptionRow[]>(`subscriptions?id=eq.${encodeURIComponent(existing.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: input.status,
      stripe_customer_id: input.customerId ?? existing.stripe_customer_id,
      current_period_start: input.periodStart ?? existing.current_period_start,
      current_period_end: input.periodEnd ?? existing.current_period_end,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? existing.cancel_at_period_end,
      canceled_at: input.canceledAt ?? existing.canceled_at,
    }),
  });
}

async function upsertSubscription(input: {
  billingPlanId: string;
  originOrderId: string;
  userId: string | null;
  email: string | null;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  status: SubscriptionRow["status"];
  periodStart: string | null;
  periodEnd: string | null;
}): Promise<SubscriptionRow | null> {
  const existing = await fetchSubscriptionByStripeId(input.stripeSubscriptionId);
  const body = {
    billing_plan_id: input.billingPlanId,
    origin_order_id: input.originOrderId,
    user_id: input.userId,
    email: input.email,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_customer_id: input.stripeCustomerId,
    status: input.status,
    current_period_start: input.periodStart,
    current_period_end: input.periodEnd,
  };

  if (existing) {
    const rows = await rest<SubscriptionRow[]>(
      `subscriptions?id=eq.${encodeURIComponent(existing.id)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    return rows[0] ?? existing;
  }

  const rows = await rest<SubscriptionRow[]>("subscriptions", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return rows[0] ?? null;
}

async function insertTransaction(input: {
  orderId: string;
  billingPlanId: string;
  subscriptionId: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amountCents: number;
  currency: string;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeInvoiceId: string | null;
  stripeEventId: string | null;
}): Promise<TransactionRow | null> {
  try {
    const rows = await rest<TransactionRow[]>("transactions", {
      method: "POST",
      body: JSON.stringify({
        order_id: input.orderId,
        billing_plan_id: input.billingPlanId,
        subscription_id: input.subscriptionId,
        type: input.type,
        status: input.status,
        amount_cents: input.amountCents,
        currency: input.currency,
        stripe_payment_intent_id: input.stripePaymentIntentId,
        stripe_charge_id: input.stripeChargeId,
        stripe_invoice_id: input.stripeInvoiceId,
        stripe_event_id: input.stripeEventId,
      }),
    });
    return rows[0] ?? null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("23505") || msg.toLowerCase().includes("duplicate")) {
      return null;
    }
    throw e;
  }
}
