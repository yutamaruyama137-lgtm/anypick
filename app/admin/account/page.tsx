import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin-auth";

export default async function AdminAccountPage() {
  const { user } = await ensureAdmin();
  const admin = createServiceRoleClient();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("email, role, created_at, tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const tenant = adminUser
    ? (await admin.from("tenants").select("name").eq("id", adminUser.tenant_id).single()).data
    : null;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="font-display text-2xl font-bold text-white mb-6">登録情報</h1>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <div>
          <p className="text-[var(--text-muted)] text-sm">メールアドレス</p>
          <p className="text-white font-medium">{user.email ?? "—"}</p>
        </div>
        {adminUser && (
          <>
            <div>
              <p className="text-[var(--text-muted)] text-sm">権限</p>
              <p className="text-white">
                {adminUser.role === "organizer_admin"
                  ? "主催者（管理者）"
                  : adminUser.role === "organizer_viewer"
                    ? "主催者（閲覧のみ）"
                    : adminUser.role}
              </p>
            </div>
            {tenant && (
              <div>
                <p className="text-[var(--text-muted)] text-sm">組織</p>
                <p className="text-white">{tenant.name}</p>
              </div>
            )}
            {adminUser.created_at && (
              <div>
                <p className="text-[var(--text-muted)] text-sm">登録日</p>
                <p className="text-white text-sm">
                  {new Date(adminUser.created_at).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <p className="mt-6">
        <Link
          href="/admin"
          className="text-white font-medium text-sm transition-smooth hover:opacity-80"
        >
          ← イベント一覧に戻る
        </Link>
      </p>
    </main>
  );
}
