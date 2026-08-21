import { useSyncExternalStore } from "react";
import type { DeedForm } from "@/lib/deed-form.types";
import type { DeedDraftStatus, PersistableCheckout } from "@/lib/deed-draft";
import { lastWizardPath } from "@/lib/deed-draft";
import { FALLBACK_PLAN_IDS } from "@/lib/checkout-plans";
import { db } from "@/lib/supabase-external";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  firm: string;
  provider: "password" | "google";
};

export type SavedDeed = {
  id: string;
  stateCode: string;
  stateName: string;
  county: string;
  address: string;
  grantee: string;
  consideration: string;
  savedAt: string;
  form?: DeedForm;
  step: number;
  checkout?: PersistableCheckout;
  parcelUsed: boolean;
  status: DeedDraftStatus;
};

type SessionState = {
  user: SessionUser | null;
  deeds: SavedDeed[];
  loading: boolean;
  /** Recurring plan name, or Trial. One-time Single package is not a plan. */
  planLabel: string;
};

export type AuthResult = { ok: boolean; error?: string; needsConfirmation?: boolean };

const day = 86_400_000;
const sampleDeeds: SavedDeed[] = [
  {
    id: "sample-ny-1",
    stateCode: "NY",
    stateName: "New York",
    county: "Kings",
    address: "418 Sterling Place, Brooklyn",
    grantee: "Ana R. Delacroix",
    consideration: "985,000",
    savedAt: new Date(Date.now() - 2 * day).toISOString(),
    step: 4,
    parcelUsed: true,
    status: "paid",
  },
  {
    id: "sample-nj-1",
    stateCode: "NJ",
    stateName: "New Jersey",
    county: "Hudson",
    address: "77 Grand Street, Jersey City",
    grantee: "Harbor Point Holdings LLC",
    consideration: "640,000",
    savedAt: new Date(Date.now() - 6 * day).toISOString(),
    step: 2,
    parcelUsed: true,
    status: "paid",
  },
  {
    id: "sample-ct-1",
    stateCode: "CT",
    stateName: "Connecticut",
    county: "Fairfield",
    address: "12 Blackberry Lane, Darien",
    grantee: "Michael & Joan Petrosian",
    consideration: "1,250,000",
    savedAt: new Date(Date.now() - 14 * day).toISOString(),
    step: 2,
    parcelUsed: true,
    status: "paid",
  },
];

const empty: SessionState = { user: null, deeds: [], loading: true, planLabel: "Trial" };
const signedOut: SessionState = { user: null, deeds: sampleDeeds, loading: false, planLabel: "Trial" };

const LIVE_SUB_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

async function planNameForId(planId: string): Promise<string | null> {
  if (planId === FALLBACK_PLAN_IDS.single) return null;
  const { data } = await db.from("billing_plans").select("name, is_recurring").eq("id", planId).maybeSingle();
  if (data?.is_recurring === false) return null;
  if (data?.name) return String(data.name);
  if (planId === FALLBACK_PLAN_IDS.monthly) return "Firm monthly";
  return null;
}

async function loadPlanLabel(userId: string): Promise<string> {
  const { data: subs } = await db
    .from("subscriptions")
    .select("billing_plan_id, status, stripe_subscription_id")
    .eq("user_id", userId);

  const live = (subs ?? []).filter((s) => LIVE_SUB_STATUSES.has(String(s.status)));
  const sub =
    live.find((s) => s.status === "active" || s.status === "trialing") ?? live[0] ?? null;
  if (sub?.billing_plan_id) {
    const name = await planNameForId(String(sub.billing_plan_id));
    if (name) return name;
  }

  const { data: orders } = await db
    .from("orders")
    .select("billing_plan_id, kind, status")
    .eq("user_id", userId)
    .eq("kind", "subscription")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1);
  const order = orders?.[0];
  if (order?.billing_plan_id) {
    const name = await planNameForId(String(order.billing_plan_id));
    if (name) return name;
  }

  return "Trial";
}

let state: SessionState = empty;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function set(next: Partial<SessionState>) {
  state = { ...state, ...next };
  emit();
}

type DeedRow = {
  id: string;
  state_code: string;
  state_name: string;
  county: string | null;
  address: string | null;
  grantee: string | null;
  consideration: string | null;
  form: DeedForm | null;
  created_at: string;
  updated_at?: string;
  wizard_step?: number | null;
  checkout?: PersistableCheckout | null;
  parcel_used?: boolean | null;
  status?: DeedDraftStatus | null;
};

function toDeed(row: DeedRow): SavedDeed {
  return {
    id: row.id,
    stateCode: row.state_code,
    stateName: row.state_name,
    county: row.county ?? "",
    address: row.address ?? "",
    grantee: row.grantee ?? "",
    consideration: row.consideration ?? "",
    savedAt: row.updated_at ?? row.created_at,
    ...(row.form ? { form: row.form } : {}),
    step: row.wizard_step ?? 0,
    ...(row.checkout ? { checkout: row.checkout } : {}),
    parcelUsed: Boolean(row.parcel_used),
    status: row.status === "paid" ? "paid" : "draft",
  };
}

async function loadUser(userId: string, email: string, provider: "password" | "google") {
  const [{ data: profile }, { data: rows }, planLabel] = await Promise.all([
    db.from("profiles").select("name, firm").eq("id", userId).maybeSingle(),
    db.from("deeds").select("*").order("created_at", { ascending: false }),
    loadPlanLabel(userId).catch(() => "Trial"),
  ]);

  set({
    user: {
      id: userId,
      email,
      name: (profile?.name as string) || email.split("@")[0] || "Attorney",
      firm: (profile?.firm as string) || "",
      provider,
    },
    deeds: ((rows ?? []) as DeedRow[]).map(toDeed),
    loading: false,
    planLabel,
  });
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  db.auth.getSession().then(({ data }) => {
    const s = data.session;
    if (!s?.user) {
      set(signedOut);
      void completeOAuthReturn();
      return;
    }
    void completeOAuthReturn();
    void loadUser(
      s.user.id,
      s.user.email ?? "",
      s.user.app_metadata?.provider === "google" ? "google" : "password",
    );
  });

  db.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") return;
    if (event === "INITIAL_SESSION") {
      if (session?.user) void completeOAuthReturn();
      return;
    }
    if (!session?.user) {
      set(signedOut);
      return;
    }
    if (event === "SIGNED_IN") void completeOAuthReturn();
    void loadUser(
      session.user.id,
      session.user.email ?? "",
      session.user.app_metadata?.provider === "google" ? "google" : "password",
    );
  });
}

function subscribe(cb: () => void) {
  start();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSession(): SessionState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => empty,
  );
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const { error } = await db.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signUpWithPassword(
  email: string,
  password: string,
  meta: { name?: string; firm?: string } = {},
): Promise<AuthResult> {
  rememberAuthReturn();
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: currentReturnUrl(),
      data: { name: meta.name ?? email.split("@")[0], firm: meta.firm ?? "" },
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, needsConfirmation: !data.session };
}

const AUTH_RETURN_KEY = "deed-auth-return";
const AUTH_RETURN_TTL_MS = 30 * 60 * 1000;

function currentReturnPath() {
  return `${window.location.pathname}${window.location.search}`;
}

function currentReturnUrl() {
  return `${window.location.origin}${currentReturnPath()}`;
}

function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return null;
  return raw;
}

function readAuthReturn(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_RETURN_KEY);
    if (!raw) return null;
    if (raw.startsWith("/")) return safeReturnPath(raw);
    const parsed = JSON.parse(raw) as { path?: string; at?: number };
    if (!parsed?.path || !parsed.at || Date.now() - parsed.at > AUTH_RETURN_TTL_MS) {
      localStorage.removeItem(AUTH_RETURN_KEY);
      return null;
    }
    return safeReturnPath(parsed.path);
  } catch {
    localStorage.removeItem(AUTH_RETURN_KEY);
    return null;
  }
}

/** Store the current wizard/account URL so OAuth (which often lands on `/`) can bounce back. */
export function rememberAuthReturn() {
  if (typeof window === "undefined") return;
  const path = currentReturnPath();
  if (path === "/" || path.startsWith("/admin")) return;
  localStorage.setItem(AUTH_RETURN_KEY, JSON.stringify({ path, at: Date.now() }));
}

function consumeAuthReturn(): string | null {
  const path = readAuthReturn();
  localStorage.removeItem(AUTH_RETURN_KEY);
  return path;
}

function authTokensInUrl() {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  const params = new URLSearchParams(window.location.search);
  return (
    hash.includes("access_token") ||
    hash.includes("refresh_token") ||
    hash.includes("error=") ||
    params.has("code")
  );
}

let completingOAuth = false;

/**
 * After Google/email lands on `/#access_token=…`, wait until the session is in
 * storage, then send the user back to the wizard. Must run on every page (root).
 */
export async function completeOAuthReturn() {
  if (typeof window === "undefined" || completingOAuth) return;

  const onLanding =
    window.location.pathname === "/" || window.location.pathname === "/auth/callback";
  const tokensInUrl = authTokensInUrl();
  const ret = readAuthReturn() ?? (tokensInUrl ? lastWizardPath() : null);
  const here = currentReturnPath();

  if (!onLanding && !tokensInUrl) return;
  if (ret && here === ret) {
    consumeAuthReturn();
    return;
  }
  if (!ret) {
    if (tokensInUrl) {
      await db.auth.getSession();
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    return;
  }

  completingOAuth = true;
  const { data } = await db.auth.getSession();
  if (!data.session) {
    completingOAuth = false;
    return;
  }
  consumeAuthReturn();
  window.location.replace(ret);
}

export async function signInWithGoogle(): Promise<AuthResult> {
  rememberAuthReturn();
  const { error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Site URL is always allow-listed. Remembered path bounces back after SIGNED_IN.
      redirectTo: `${window.location.origin}/`,
      queryParams: { prompt: "select_account" },
    },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export function signOut() {
  set(signedOut);
  void db.auth.signOut().catch(() => undefined);
}

export async function updateProfile(patch: Partial<Pick<SessionUser, "name" | "firm">>) {
  if (!state.user) return;
  const user = { ...state.user, ...patch };
  set({ user });
  await db.from("profiles").upsert({
    id: user.id,
    email: user.email,
    name: user.name,
    firm: user.firm,
  });
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const { error } = await db.auth.updateUser({ password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

function propertyAddress(form: DeedForm) {
  return [[form.house, form.street].filter(Boolean).join(" "), form.city].filter(Boolean).join(", ");
}

export async function saveDeed(deed: Omit<SavedDeed, "id" | "savedAt">) {
  if (!state.user) return;
  const { data, error } = await db
    .from("deeds")
    .insert({
      user_id: state.user.id,
      state_code: deed.stateCode,
      state_name: deed.stateName,
      county: deed.county,
      address: deed.address,
      grantee: deed.grantee,
      consideration: deed.consideration,
      form: deed.form ?? null,
      wizard_step: deed.step,
      checkout: deed.checkout ?? null,
      parcel_used: deed.parcelUsed,
      status: deed.status,
    })
    .select("*")
    .single();
  if (error || !data) return;
  set({ deeds: [toDeed(data as DeedRow), ...state.deeds.filter((d) => d.id !== data.id)] });
}

export type DeedDraftUpsert = {
  id: string;
  stateCode: string;
  stateName: string;
  form: DeedForm;
  checkout: PersistableCheckout;
  step: number;
  parcelUsed: boolean;
  status: DeedDraftStatus;
};

export async function upsertDeedDraft(input: DeedDraftUpsert) {
  if (!state.user) return;
  const existing = state.deeds.find((d) => d.id === input.id);
  if (existing?.status === "paid" && input.status !== "paid") return;
  const { data, error } = await db
    .from("deeds")
    .upsert({
      id: input.id,
      user_id: state.user.id,
      state_code: input.stateCode,
      state_name: input.stateName,
      county: input.form.county,
      address: propertyAddress(input.form),
      grantee: input.form.granteeName,
      consideration: input.form.consideration,
      form: input.form,
      wizard_step: input.step,
      checkout: input.checkout,
      parcel_used: input.parcelUsed,
      status: existing?.status === "paid" ? "paid" : input.status,
    })
    .select("*")
    .single();
  if (error || !data) return;
  const next = toDeed(data as DeedRow);
  set({ deeds: [next, ...state.deeds.filter((d) => d.id !== next.id)] });
}

export async function loadDeedById(id: string): Promise<SavedDeed | null> {
  const { data, error } = await db.from("deeds").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return toDeed(data as DeedRow);
}

export async function loadLatestDeedForState(stateCode: string): Promise<SavedDeed | null> {
  const { data, error } = await db
    .from("deeds")
    .select("*")
    .eq("state_code", stateCode)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return toDeed(data as DeedRow);
}

export async function removeDeed(id: string) {
  set({ deeds: state.deeds.filter((d) => d.id !== id) });
  if (!state.user) return;
  await db.from("deeds").delete().eq("id", id);
}
