import { useSyncExternalStore } from "react";
import type { DeedForm } from "@/lib/deed-form.types";
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
};

type SessionState = { user: SessionUser | null; deeds: SavedDeed[]; loading: boolean };

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
  },
];

const empty: SessionState = { user: null, deeds: [], loading: true };
const signedOut: SessionState = { user: null, deeds: sampleDeeds, loading: false };

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
    savedAt: row.created_at,
    ...(row.form ? { form: row.form } : {}),
  };
}

async function loadUser(userId: string, email: string, provider: "password" | "google") {
  const [{ data: profile }, { data: rows }] = await Promise.all([
    db.from("profiles").select("name, firm").eq("id", userId).maybeSingle(),
    db.from("deeds").select("*").order("created_at", { ascending: false }),
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
  });
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  db.auth.getSession().then(({ data }) => {
    const s = data.session;
    if (!s?.user) {
      set(signedOut);
      return;
    }
    void loadUser(
      s.user.id,
      s.user.email ?? "",
      s.user.app_metadata?.provider === "google" ? "google" : "password",
    );
  });

  db.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
    if (!session?.user) {
      set(signedOut);
      return;
    }
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
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { name: meta.name ?? email.split("@")[0], firm: meta.firm ?? "" },
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, needsConfirmation: !data.session };
}

function currentReturnUrl() {
  // Return the user to the page they signed in from, on this exact origin.
  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const { error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: currentReturnUrl(),
      queryParams: { prompt: "select_account" },
    },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut() {
  await db.auth.signOut();
  set(signedOut);
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
    })
    .select("*")
    .single();
  if (error || !data) return;
  set({ deeds: [toDeed(data as DeedRow), ...state.deeds] });
}

export async function removeDeed(id: string) {
  set({ deeds: state.deeds.filter((d) => d.id !== id) });
  if (!state.user) return;
  await db.from("deeds").delete().eq("id", id);
}
