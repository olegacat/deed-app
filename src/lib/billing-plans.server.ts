/** Read billing_plans from Supabase (service role). */

import type { BillingPlanRow } from "@/lib/billing-plans";

export type { BillingPlanRow };

/** Service-role REST config. Prefers EXT_* (Deed project), then Lovable SUPABASE_*. */
export function supabaseRestConfig(): { url: string; key: string } | null {
  const url = process.env["EXT_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key = process.env["EXT_SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return { url, key };
}

export async function fetchBillingPlan(planId: string): Promise<BillingPlanRow | null> {
  const cfg = supabaseRestConfig();
  if (!cfg) return null;

  const res = await fetch(
    `${cfg.url}/rest/v1/billing_plans?id=eq.${encodeURIComponent(planId)}&active=eq.true&select=*`,
    {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Could not load billing plan "${planId}" (${res.status}).`);
  }

  const rows = (await res.json()) as BillingPlanRow[];
  return rows[0] ?? null;
}

export async function fetchAllBillingPlans(): Promise<BillingPlanRow[]> {
  const cfg = supabaseRestConfig();
  if (!cfg) {
    throw new Error(
      "Supabase service credentials are missing. Add SUPABASE_SERVICE_ROLE_KEY (or EXT_SUPABASE_URL + EXT_SUPABASE_SECRET_KEY) to .env and restart the server.",
    );
  }

  const res = await fetch(`${cfg.url}/rest/v1/billing_plans?select=*&order=sort_order.asc`, {
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Could not load billing plans (${res.status}).`);
  }

  return (await res.json()) as BillingPlanRow[];
}

export async function fetchActiveBillingPlans(): Promise<BillingPlanRow[]> {
  const cfg = supabaseRestConfig();
  if (!cfg) return [];

  const res = await fetch(
    `${cfg.url}/rest/v1/billing_plans?active=eq.true&select=*&order=sort_order.asc`,
    {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Could not load billing plans (${res.status}).`);
  }

  return (await res.json()) as BillingPlanRow[];
}
