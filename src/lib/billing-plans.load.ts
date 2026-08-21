import {
  fetchActiveBillingPlans,
  fetchBillingPlan,
  type BillingPlanRow,
} from "@/lib/billing-plans.server";
import { toPublicBillingPlan, type PublicBillingPlan } from "@/lib/billing-plans";
import {
  CHECKOUT_PLANS_FALLBACK,
  defaultPlanPerks,
  isBillingPlanId,
} from "@/lib/checkout-plans";

export type { BillingPlanRow } from "@/lib/billing-plans.server";
export { fetchBillingPlan, fetchActiveBillingPlans } from "@/lib/billing-plans.server";

/** Fallback when Supabase billing_plans is empty or not configured (local dev). */
export function checkoutPlansFallback(): PublicBillingPlan[] {
  return CHECKOUT_PLANS_FALLBACK.map((p) => ({
    id: p.id,
    label: p.label,
    displayPrice: p.displayPrice,
    cadence: p.cadence,
    blurb: p.blurb,
    recurring: p.recurring,
    amountCents: p.unitAmount,
    perks: [...p.perks],
  }));
}

export async function loadPublicBillingPlans(): Promise<PublicBillingPlan[]> {
  try {
    const rows = await fetchActiveBillingPlans();
    const plans = rows.map((row) => toPublicBillingPlan(row, defaultPlanPerks(row.is_recurring)));
    if (plans.length > 0) return plans;
  } catch {
    /* fall through */
  }
  return checkoutPlansFallback();
}

export async function resolveBillingPlanForCheckout(planId: string): Promise<BillingPlanRow | null> {
  if (!isBillingPlanId(planId)) return null;
  try {
    const row = await fetchBillingPlan(planId);
    if (row) return row;
  } catch {
    /* fall through */
  }
  return null;
}

export function billingPlanRowFromFallback(planId: string): BillingPlanRow {
  const p = CHECKOUT_PLANS_FALLBACK.find((row) => row.id === planId);
  if (!p) throw new Error(`Unknown plan "${planId}".`);
  return {
    id: p.id,
    name: p.productName,
    description: p.blurb,
    amount_cents: p.unitAmount,
    currency: "usd",
    is_recurring: p.recurring,
    billing_interval: p.recurring && "interval" in p ? p.interval : null,
    active: true,
  };
}

export function assertBillingPlanId(planId: string): string {
  if (!isBillingPlanId(planId)) throw new Error(`Invalid plan id "${planId}".`);
  return planId;
}
