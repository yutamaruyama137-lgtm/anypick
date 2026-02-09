import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAppOrigin } from "@/lib/app-url";
import { ensureAdmin } from "@/lib/admin-auth";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { adminUser } = await ensureAdmin();
  const admin = createServiceRoleClient();

  const { data: events } = await admin
    .from("events")
    .select("id, name, event_token, status, created_at")
    .eq("tenant_id", adminUser.tenant_id)
    .order("created_at", { ascending: false });

  const origin = getAppOrigin();
  const createdId = (await searchParams).created;

  return (
    <main className="max-w-6xl mx-auto p-6">
      {createdId && (
        <div className="mb-6 rounded-2xl bg-green-500/15 border border-green-500/40 px-4 py-3 flex items-center justify-between gap-4 animate-fade-in-up">
          <p className="text-green-400 text-sm">イベントを作成しました。</p>
          <Link
            href={`/admin/events/${createdId}`}
            className="rounded-xl bg-green-500 px-3 py-1.5 text-sm font-medium text-black transition-smooth hover:bg-green-400 active:scale-[0.98]"
          >
            作成したイベントを開く
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-white">
          イベント一覧
        </h1>
        <Link
          href="/admin/events/new"
          className="rounded-2xl bg-white px-5 py-2.5 font-semibold text-black transition-smooth hover:bg-zinc-200 active:scale-[0.98] focus-ring"
        >
          新規イベント
        </Link>
      </div>
      {!events?.length ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-[var(--text-muted)]">
          イベントがありません。新規作成から始めましょう。
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/admin/events/${ev.id}`}
                className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-smooth hover:border-[var(--border-light)] hover:bg-[var(--surface-elevated)] active:scale-[0.998]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{ev.name}</p>
                    <p className="text-[var(--text-muted)] text-sm mt-1">
                      /e/{ev.event_token} · {ev.status}
                    </p>
                  </div>
                  <span className="text-[var(--text-muted)] text-sm">
                    {new Date(ev.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <p className="text-[var(--text-dim)] text-xs mt-2 break-all">
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
