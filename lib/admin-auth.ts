import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

type AdminUser = { tenant_id: string };

/**
 * 認証済みユーザーについて admin_users を取得。無ければ tenant + admin_user を自動作成する。
 * 一度ログインしたら、すべての管理画面でログインに飛ばさないために使用。
 */
export async function getOrCreateAdminUser(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  email: string | undefined
): Promise<AdminUser | null> {
  let { data: adminUser } = await admin
    .from("admin_users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (!adminUser && email) {
    const { data: newTenant, error: tenantErr } = await admin
      .from("tenants")
      .insert({ name: email })
      .select("id")
      .single();
    if (!tenantErr && newTenant) {
      await admin.from("admin_users").insert({
        id: userId,
        tenant_id: newTenant.id,
        email,
        role: "organizer_admin",
      });
      adminUser = { tenant_id: newTenant.id };
    }
  }
  return adminUser;
}

/**
 * 管理画面用: 認証チェック + admin_user の取得（無ければ自動作成）。
 * 未ログイン時のみ /admin/login にリダイレクト。認証済みなら必ず { user, adminUser } を返す。
 */
export async function ensureAdmin(): Promise<{
  user: { id: string; email?: string };
  adminUser: AdminUser;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = createServiceRoleClient();
  const adminUser = await getOrCreateAdminUser(admin, user.id, user.email ?? undefined);
  if (!adminUser) redirect("/admin/login");

  return { user, adminUser };
}
