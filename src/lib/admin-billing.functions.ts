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
