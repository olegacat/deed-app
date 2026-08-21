/** Row shape from Supabase `billing_plans` — source of truth for pricing. */
export type BillingPlanRow = {
  id: string;
  name: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  is_recurring: boolean;
  billing_interval: string | null;
  active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

/** Plan card data for Checkout UI (loaded from DB). */
export type PublicBillingPlan = {
  id: string;
  label: string;
  displayPrice: string;
  cadence: string;
  blurb: string;
  recurring: boolean;
  amountCents: number;
  perks: string[];
};

export function formatPlanDisplayPrice(amountCents: number, currency = "usd"): string {
  const symbol = currency.toLowerCase() === "usd" ? "$" : "";
  const amount = amountCents / 100;
  const whole = amountCents % 100 === 0;
  return `${symbol}${amount.toFixed(whole ? 0 : 2)}`;
}

export function planCadence(row: Pick<BillingPlanRow, "is_recurring" | "billing_interval">): string {
  if (!row.is_recurring) return "one-time";
  if (row.billing_interval === "month") return "per month";
  if (row.billing_interval === "year") return "per year";
  if (row.billing_interval) return `per ${row.billing_interval}`;
  return "recurring";
}

export function toPublicBillingPlan(
  row: BillingPlanRow,
  perks: string[],
): PublicBillingPlan {
  return {
    id: row.id,
    label: row.name,
    displayPrice: formatPlanDisplayPrice(row.amount_cents, row.currency),
    cadence: planCadence(row),
    blurb: row.description ?? "",
    recurring: row.is_recurring,
    amountCents: row.amount_cents,
    perks,
  };
}

export function formatPlanIdShort(id: string): string {
  if (id.length <= 13) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}
