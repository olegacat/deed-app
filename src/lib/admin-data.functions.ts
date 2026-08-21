import { createServerFn } from "@tanstack/react-start";

export interface RawProfile {
  id: string;
  email: string | null;
  name: string | null;
  firm: string | null;
  created_at: string;
  updated_at: string;
}
export interface RawBillingSub {
  id: string;
  billing_plan_id: string;
  user_id: string | null;
  email: string | null;
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_end: string | null;
  updated_at: string | null;
  created_at: string;
}
export interface RawPlan {
  id: string;
  name: string;
  amount_cents: number;
  is_recurring: boolean;
}
export interface RawJurisdiction {
  id: string;
  code: string;
  name: string;
  status: string;
  transfer_tax_rate: number | null;
  mansion_tax_rate: number | null;
  recording_fee: number | null;
  forms: string[] | null;
  notes: string | null;
  updated_at: string;
}
export interface RawUsageDay {
  day: string;
  jurisdiction_code: string;
  lookups: number;
  failures: number;
  api_cost: number;
}

export interface AdminDataPayload {
  profiles: RawProfile[];
  subscriptions: RawBillingSub[];
  plans: RawPlan[];
  jurisdictions: RawJurisdiction[];
  usage: RawUsageDay[];
}

/** Internal console shared passphrase — the console has no per-user backend auth yet. */
const ADMIN_TOKEN = "deedadmin";

function guard(token: string) {
  if (token !== ADMIN_TOKEN) throw new Error("Not authorized for the internal console.");
}

async function rest<T>(path: string): Promise<T[]> {
  const url = process.env["EXT_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key = process.env["EXT_SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Backend credentials are not configured.");
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Backend read failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as T[];
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
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Backend write failed (${res.status}): ${await res.text()}`);
}

export const loadAdminData = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }): Promise<AdminDataPayload> => {
    guard(data.token);
    const since = new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
    const [profiles, subscriptions, plans, jurisdictions, usage] = await Promise.all([
      rest<RawProfile>("profiles?select=id,email,name,firm,created_at,updated_at&order=created_at.desc&limit=1000"),
      rest<RawBillingSub>(
        "subscriptions?select=id,billing_plan_id,user_id,email,status,stripe_subscription_id,stripe_customer_id,current_period_end,updated_at,created_at&order=updated_at.desc&limit=500",
      ),
      rest<RawPlan>("billing_plans?select=id,name,amount_cents,is_recurring"),
      rest<RawJurisdiction>("jurisdictions?select=*&order=name.asc"),
      rest<RawUsageDay>(
        `usage_daily?select=day,jurisdiction_code,lookups,failures,api_cost&day=gte.${since}&order=day.asc&limit=5000`,
      ),
    ]);
    return { profiles, subscriptions, plans, jurisdictions, usage };
  });

export const saveJurisdiction = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; code: string; patch: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    guard(data.token);
    await write(`jurisdictions?code=eq.${encodeURIComponent(data.code)}`, data.patch, "PATCH");
    return { ok: true };
  });

export const saveSubscription = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; accountId: string; account?: Record<string, unknown>; subscription?: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    guard(data.token);
    if (data.account && Object.keys(data.account).length) {
      // Customer records live in public.profiles — not a separate accounts table.
    }
    if (data.subscription && Object.keys(data.subscription).length) {
      // Recurring state lives in Stripe + public.subscriptions (user_id). Do not PATCH a fake account_id.
    }
    return { ok: true };
  });
