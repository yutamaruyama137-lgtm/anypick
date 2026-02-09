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

  // 同一メールで別ログイン（例: メール vs Google）の場合は既存テナントを返す
  if (!adminUser && email) {
    const { data: byEmail } = await admin
      .from("admin_users")
      .select("tenant_id")
      .eq("email", email)
      .maybeSingle();
    if (byEmail) return byEmail;
  }

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
 * @param returnTo 未ログイン時にリダイレクトする先のクエリ。ログイン後にこのURLへ戻す（例: /admin/events/xxx）
 */
export async function ensureAdmin(returnTo?: string): Promise<{
  user: { id: string; email?: string };
  adminUser: AdminUser;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const loginUrl = returnTo
      ? `/admin/login?next=${encodeURIComponent(returnTo)}`
      : "/admin/login";
    redirect(loginUrl);
  }

  const admin = createServiceRoleClient();
  const adminUser = await getOrCreateAdminUser(admin, user.id, user.email ?? undefined);
  if (!adminUser) {
    const loginUrl = returnTo
      ? `/admin/login?next=${encodeURIComponent(returnTo)}`
      : "/admin/login";
    redirect(loginUrl);
  }

  return { user, adminUser };
}

/**
 * API用: 現在のリクエストのテナントIDを取得。未ログイン or 管理ユーザーでない場合は null。
 * ページの ensureAdmin と同じ getOrCreateAdminUser を使うので、同一メール＝同一テナントで一貫する。
 */
export async function getAdminTenantId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createServiceRoleClient();
  const adminUser = await getOrCreateAdminUser(admin, user.id, user.email ?? undefined);
  return adminUser?.tenant_id ?? null;
}
