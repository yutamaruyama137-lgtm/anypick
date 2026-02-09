import { createClient } from "@supabase/supabase-js";

/** サーバー専用。署名URL発行・RLS を超えた操作に使用。厳重に管理すること。 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service role env");
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
