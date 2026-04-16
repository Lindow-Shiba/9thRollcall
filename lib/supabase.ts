import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service role key.
 * NEVER import this in client components — it bypasses RLS.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------- types mirroring the schema ----------

export type Platoon = {
  id: number;
  name: string;
  ping_role_id: string | null;
  created_at: string;
};

export type Squad = {
  id: number;
  platoon_id: number;
  name: string;
  kind: "squad" | "section" | "reserve";
  sort_order: number;
};

export type Webhook = {
  id: number;
  platoon_id: number;
  label: string;
  url: string;
  created_at: string;
};
