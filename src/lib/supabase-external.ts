import { createClient } from "@supabase/supabase-js";

// Deed Copilot's own Supabase project. The publishable key is safe in client code.
export const SUPABASE_URL = "https://szplgdmqdiwsbcwmcjdx.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6OA1-aAan3nf5kuVIMq2bg_FaolPnVI";

function isOpaqueKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

// Opaque sb_ keys are not JWTs — PostgREST rejects them as bearer tokens.
const patchedFetch: typeof fetch = (input, init) => {
  const headers = new Headers(
    typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
  );
  if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
  if (
    isOpaqueKey(SUPABASE_PUBLISHABLE_KEY) &&
    headers.get("Authorization") === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
  ) {
    headers.delete("Authorization");
  }
  headers.set("apikey", SUPABASE_PUBLISHABLE_KEY);
  return fetch(input, { ...init, headers });
};

export const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: patchedFetch },
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
