/** public.profiles via service-role REST. */

import { supabaseRestConfig } from "@/lib/billing-plans.server";

export type ProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  firm: string | null;
  created_at: string;
  updated_at: string;
};

export type DeedCountRow = {
  user_id: string | null;
  status: string | null;
};

async function rest<T>(path: string): Promise<T> {
  const cfg = supabaseRestConfig();
  if (!cfg) {
    throw new Error(
      "Supabase service credentials are missing. Add SUPABASE_SERVICE_ROLE_KEY to .env and restart the server.",
    );
  }
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Could not load ${path.split("?")[0]} (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function fetchAllProfiles(): Promise<ProfileRow[]> {
  return rest<ProfileRow[]>("profiles?select=*&order=created_at.desc&limit=1000");
}

export async function fetchDeedUserRows(): Promise<DeedCountRow[]> {
  return rest<DeedCountRow[]>("deeds?select=user_id,status&limit=5000");
}
