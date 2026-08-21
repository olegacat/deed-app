/** Stable UUIDs for seed + local dev fallback (match 003_seed_billing_plans.sql). */
export const FALLBACK_PLAN_IDS = {
  single: "11111111-1111-4111-8111-111111111101",
  monthly: "11111111-1111-4111-8111-111111111102",
} as const;

/** Fallback plan copy when billing_plans is unavailable (local dev). Live pricing comes from Supabase. */
export const CHECKOUT_PLAN_PERKS = {
  oneTime: [
    "Draft deed + recording forms",
    "Transfer-tax worksheet",
    "PDF export & email copy",
  ],
  recurring: [
    "Everything in Single package",
    "Unlimited deed packages",
    "Saved matters in your account",
  ],
} as const;

export const CHECKOUT_PLANS_FALLBACK = [
  {
    id: FALLBACK_PLAN_IDS.single,
    label: "Single package",
    displayPrice: "$49",
    cadence: "one-time",
    productName: "Deed Copilot — single deed package",
    unitAmount: 4900,
    recurring: false as const,
    blurb: "One deed package for this property.",
    perks: [...CHECKOUT_PLAN_PERKS.oneTime],
  },
  {
    id: FALLBACK_PLAN_IDS.monthly,
    label: "Firm monthly",
    displayPrice: "$149",
    cadence: "per month",
    productName: "Deed Copilot — firm monthly",
    unitAmount: 14900,
    recurring: true as const,
    interval: "month" as const,
    blurb: "Unlimited packages across all live states.",
    perks: [...CHECKOUT_PLAN_PERKS.recurring],
  },
] as const;

/** @deprecated Use plan UUID from billing_plans; kept for type migration only. */
export type CheckoutPlan = typeof FALLBACK_PLAN_IDS.single | typeof FALLBACK_PLAN_IDS.monthly;

/** @deprecated Use CHECKOUT_PLANS_FALLBACK */
export const CHECKOUT_PLANS = {
  single: CHECKOUT_PLANS_FALLBACK[0],
  monthly: CHECKOUT_PLANS_FALLBACK[1],
} as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBillingPlanId(id: string): boolean {
  return UUID_RE.test(id);
}

export function defaultPlanPerks(recurring: boolean): string[] {
  return recurring ? [...CHECKOUT_PLAN_PERKS.recurring] : [...CHECKOUT_PLAN_PERKS.oneTime];
}
