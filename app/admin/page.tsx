import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAppOrigin } from "@/lib/app-url";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = createServiceRoleClient();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!adminUser) redirect("/admin/login");

  const { data: events } = await admin
    .from("events")
    .select("id, name, event_token, status, created_at")
    .eq("tenant_id", adminUser.tenant_id)
    .order("created_at", { ascending: false });

  const origin = getAppOrigin();

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-white">
          イベント一覧
        </h1>
        <Link
          href="/admin/events/new"
          className="rounded-xl bg-brand-500 px-4 py-2 font-medium text-black"
        >
          新規イベント
        </Link>
      </div>
      {!events?.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-surface-900/50 p-12 text-center text-zinc-500">
          イベントがありません。新規作成から始めましょう。
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/admin/events/${ev.id}`}
                className="block rounded-xl border border-zinc-800 bg-surface-900/50 p-4 hover:border-zinc-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{ev.name}</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      /e/{ev.event_token} · {ev.status}
                    </p>
                  </div>
                  <span className="text-zinc-500 text-sm">
                    {new Date(ev.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <p className="text-zinc-600 text-xs mt-2 break-all">
                  参加者URL: {origin}/e/{ev.event_token}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
