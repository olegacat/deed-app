import { useSyncExternalStore } from "react";
import { STATES } from "@/data/states";
import { loadAdminData, saveJurisdiction, saveSubscription } from "@/lib/admin-data.functions";

export type PlanTier = "starter" | "professional" | "firm";
export type SubStatus = "active" | "trial" | "past_due" | "canceled" | "paused";

export const PLAN_LABEL: Record<PlanTier, string> = {
  starter: "Starter",
  professional: "Professional",
  firm: "Firm",
};
export const PLAN_PRICE: Record<PlanTier, number> = {
  starter: 49,
  professional: 149,
  firm: 499,
};
export const PLAN_QUOTA: Record<PlanTier, number> = {
  starter: 3,
  professional: 25,
  firm: 150,
};
export const STATUS_LABEL: Record<SubStatus, string> = {
  active: "Active",
  trial: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  paused: "Paused",
};

export interface Account {
  id: string;
  firm: string;
  email: string;
  plan: PlanTier;
  status: SubStatus;
  seats: number;
  mrr: number;
  deedsUsed: number;
  renewalDate: string;
  stripeSubId: string;
  stripeCustomerId: string;
  lastPayment: { result: "success" | "failed"; date: string; amount: number };
  discountNote?: string;
  compUntil?: string;
  cancelAtPeriodEnd?: boolean;
  notes: { at: string; by: string; text: string }[];
}

export interface JurisdictionRule {
  code: string;
  name: string;
  status: "live" | "beta";
  countyCount: number;
  baseRate: string;
  formula: string;
  overrides: { county: string; rule: string }[];
  forms: string[];
  updatedAt: string;
  changelog: { at: string; by: string; what: string }[];
  lookupFailureRate: number;
}

export interface UsageRow {
  code: string;
  name: string;
  deeds: number;
  apiCalls: number;
  apiCost: number;
  failureRate: number;
  trend: number[];
}

export interface UsageDay {
  day: string;
  code: string;
  lookups: number;
  failures: number;
  cost: number;
}

export type AdminState = {
  admin: { email: string; name: string } | null;
  accounts: Account[];
  jurisdictions: JurisdictionRule[];
  usage: UsageDay[];
  loading: boolean;
  error: string | null;
};

const ADMIN_EMAIL = "admin@deedcopilot.internal";
const ADMIN_PASSWORD = "deedadmin";
const KEY = "deed-copilot-admin";

/* ---------------------------------------------------------------- mapping */

function toPlan(v: string): PlanTier {
  const s = v.toLowerCase();
  if (s === "firm" || s === "enterprise") return "firm";
  if (s === "pro" || s === "professional") return "professional";
  return "starter";
}
function fromPlan(p: PlanTier): string {
  return p === "professional" ? "pro" : p;
}
function toStatus(v: string): SubStatus {
  const s = v.toLowerCase();
  return (["active", "trial", "past_due", "canceled", "paused"] as SubStatus[]).includes(s as SubStatus)
    ? (s as SubStatus)
    : "active";
}
function pct(rate: number | null): string {
  if (rate == null) return "Research-grade estimate";
  return `${(rate * 100).toFixed(2)}% of consideration`;
}

const empty: AdminState = {
  admin: null,
  accounts: [],
  jurisdictions: [],
  usage: [],
  loading: false,
  error: null,
};

let state: AdminState = empty;
let hydrated = false;
let fetched = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function set(patch: Partial<AdminState>) {
  state = { ...state, ...patch };
  emit();
}

function readAdmin(): AdminState["admin"] {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { admin?: AdminState["admin"] }).admin ?? null;
  } catch {
    return null;
  }
}
function writeAdmin(admin: AdminState["admin"]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ admin }));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------- data fetch */

export async function refreshAdminData() {
  if (!state.admin) return;
  set({ loading: true, error: null });
  try {
    const payload = await loadAdminData({ data: { token: ADMIN_PASSWORD } });
    const subByAccount = new Map(payload.subscriptions.map((s) => [s.account_id, s]));

    const usage: UsageDay[] = payload.usage.map((u) => ({
      day: u.day,
      code: u.jurisdiction_code,
      lookups: Number(u.lookups) || 0,
      failures: Number(u.failures) || 0,
      cost: Number(u.api_cost) || 0,
    }));

    const failureByCode = new Map<string, { l: number; f: number }>();
    usage.forEach((u) => {
      const cur = failureByCode.get(u.code) ?? { l: 0, f: 0 };
      failureByCode.set(u.code, { l: cur.l + u.lookups, f: cur.f + u.failures });
    });

    const accounts: Account[] = payload.accounts.map((a) => {
      const sub = subByAccount.get(a.id);
      const plan = toPlan(sub?.plan ?? a.plan);
      const status = toStatus(sub?.status ?? a.status);
      const mrr = Number(sub?.mrr ?? 0);
      return {
        id: a.id,
        firm: a.firm_name,
        email: a.primary_email,
        plan,
        status,
        seats: a.seats ?? 0,
        mrr,
        deedsUsed: 0,
        renewalDate: sub?.renews_at ?? a.created_at,
        stripeSubId: sub?.id ?? "—",
        stripeCustomerId: a.id,
        lastPayment: {
          result: status === "past_due" ? "failed" : "success",
          date: sub?.updated_at ?? a.created_at,
          amount: mrr,
        },
        notes: [],
      };
    });

    const jurisdictions: JurisdictionRule[] = payload.jurisdictions.map((j) => {
      const meta = STATES.find((s) => s.code === j.code);
      const agg = failureByCode.get(j.code);
      return {
        code: j.code,
        name: j.name,
        status: j.status === "live" ? "live" : "beta",
        countyCount: meta?.counties?.length ?? 0,
        baseRate: pct(j.transfer_tax_rate == null ? null : Number(j.transfer_tax_rate)),
        formula:
          j.notes ??
          ([
            j.transfer_tax_rate != null ? `transfer tax ${(Number(j.transfer_tax_rate) * 100).toFixed(2)}%` : null,
            j.mansion_tax_rate != null ? `mansion tax ${(Number(j.mansion_tax_rate) * 100).toFixed(2)}% ≥ $1M` : null,
            j.recording_fee != null ? `recording fee $${Number(j.recording_fee).toFixed(2)}` : null,
          ]
            .filter(Boolean)
            .join(" + ") ||
            "Generic engine — verify against county recorder before filing."),
        overrides: [],
        forms: j.forms ?? [],
        updatedAt: j.updated_at,
        changelog: [{ at: j.updated_at, by: "backend", what: "Synced from rate table" }],
        lookupFailureRate: agg && agg.l ? Math.round((agg.f / agg.l) * 1000) / 10 : 0,
      };
    });

    set({ accounts, jurisdictions, usage, loading: false, error: null });
  } catch (e) {
    set({ loading: false, error: e instanceof Error ? e.message : "Could not load backend data." });
  }
}

function subscribe(cb: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = { ...empty, admin: readAdmin() };
  }
  listeners.add(cb);
  if (state.admin && !fetched) {
    fetched = true;
    void refreshAdminData();
  }
  return () => listeners.delete(cb);
}

export function useAdminStore(): AdminState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => empty,
  );
}

/* ------------------------------------------------------------------ auth */

export function adminSignIn(email: string, password: string): { ok: boolean; error?: string } {
  if (!hydrated) {
    hydrated = true;
    state = { ...empty, admin: readAdmin() };
  }
  if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return { ok: false, error: "Invalid internal credentials." };
  }
  const admin = { email: ADMIN_EMAIL, name: "Internal Admin" };
  writeAdmin(admin);
  set({ admin });
  fetched = true;
  void refreshAdminData();
  return { ok: true };
}

export function adminSignOut() {
  writeAdmin(null);
  fetched = false;
  state = { ...empty, admin: null };
  emit();
}

export const ADMIN_HINT = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };

export function getAdmin() {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    state = { ...empty, admin: readAdmin() };
  }
  return state.admin;
}

/* -------------------------------------------------------------- mutations */

export function updateJurisdiction(code: string, patch: Partial<JurisdictionRule>, what: string) {
  const by = state.admin?.email ?? "unknown";
  const at = new Date().toISOString();
  set({
    jurisdictions: state.jurisdictions.map((j) =>
      j.code === code
        ? { ...j, ...patch, updatedAt: at, changelog: [{ at, by, what }, ...j.changelog].slice(0, 25) }
        : j,
    ),
  });
  const remote: Record<string, unknown> = { updated_at: at };
  if (patch.status) remote["status"] = patch.status;
  if (patch.forms) remote["forms"] = patch.forms;
  if (patch.formula) remote["notes"] = patch.formula;
  void saveJurisdiction({ data: { token: ADMIN_PASSWORD, code, patch: remote } }).catch((e: unknown) =>
    set({ error: e instanceof Error ? e.message : "Save failed." }),
  );
}

export function updateAccount(id: string, patch: Partial<Account>, note?: string) {
  const by = state.admin?.email ?? "unknown";
  set({
    accounts: state.accounts.map((a) =>
      a.id === id
        ? {
            ...a,
            ...patch,
            notes: note ? [{ at: new Date().toISOString(), by, text: note }, ...a.notes] : a.notes,
          }
        : a,
    ),
  });
  const sub: Record<string, unknown> = {};
  if (patch.plan) sub["plan"] = fromPlan(patch.plan);
  if (patch.status) sub["status"] = patch.status;
  const acct: Record<string, unknown> = {};
  if (patch.plan) acct["plan"] = fromPlan(patch.plan);
  if (patch.status) acct["status"] = patch.status;
  if (!Object.keys(sub).length && !Object.keys(acct).length) return;
  void saveSubscription({ data: { token: ADMIN_PASSWORD, accountId: id, account: acct, subscription: sub } }).catch(
    (e: unknown) => set({ error: e instanceof Error ? e.message : "Save failed." }),
  );
}

/* --------------------------------------------------------------- derived */

export function mrrOf(a: Account) {
  if (a.status === "active" || a.status === "past_due") return a.mrr || PLAN_PRICE[a.plan];
  return 0;
}

/** Aggregates real daily backend usage into per-jurisdiction rows. */
export function usageRows(jurisdictions: JurisdictionRule[], days = 30): UsageRow[] {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const rows = state.usage.filter((u) => u.day >= cutoff);
  const byCode = new Map<string, UsageDay[]>();
  rows.forEach((u) => {
    const list = byCode.get(u.code) ?? [];
    list.push(u);
    byCode.set(u.code, list);
  });

  return jurisdictions
    .map((j) => {
      const list = (byCode.get(j.code) ?? []).slice().sort((a, b) => a.day.localeCompare(b.day));
      const apiCalls = list.reduce((s, u) => s + u.lookups, 0);
      const failures = list.reduce((s, u) => s + u.failures, 0);
      const apiCost = Math.round(list.reduce((s, u) => s + u.cost, 0) * 100) / 100;
      const buckets = 8;
      const size = Math.max(1, Math.ceil(list.length / buckets));
      const trend: number[] = [];
      for (let i = 0; i < list.length; i += size) {
        trend.push(list.slice(i, i + size).reduce((s, u) => s + Math.max(0, u.lookups - u.failures), 0));
      }
      return {
        code: j.code,
        name: j.name,
        deeds: apiCalls - failures,
        apiCalls,
        apiCost,
        failureRate: apiCalls ? Math.round((failures / apiCalls) * 1000) / 10 : 0,
        trend: trend.length > 1 ? trend : [0, 0],
      };
    })
    .filter((r) => r.apiCalls > 0)
    .sort((a, b) => b.deeds - a.deeds);
}

export function fmtMoney(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
