import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAppOrigin } from "@/lib/app-url";
import { ensureAdmin } from "@/lib/admin-auth";

const AdminEventTabs = dynamic(() => import("./AdminEventTabs").then((m) => ({ default: m.AdminEventTabs })), {
  loading: () => (
    <div className="animate-fade-in">
      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] mb-6 w-fit max-w-full">
        {["分析", "フレーム", "QR", "応募一覧", "設定"].map((label) => (
          <span key={label} className="px-4 py-2 text-sm text-[var(--text-muted)]">
            {label}
          </span>
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="h-32 flex items-center justify-center text-[var(--text-muted)] text-sm">
          読み込み中…
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const { adminUser } = await ensureAdmin(`/admin/events/${eventId}`);
  const admin = createServiceRoleClient();

  let { data: event } = await admin
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("tenant_id", adminUser.tenant_id)
    .maybeSingle();

  // 自テナントで見つからない場合、イベント自体は存在するか確認（別テナント or 作成直後の読み取り遅延）
  if (!event) {
    const { data: eventAny } = await admin
      .from("events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();
    if (eventAny) {
      return (
        <main className="max-w-lg mx-auto p-6">
          <p className="text-amber-400 mb-4">このイベントにアクセスする権限がありません。</p>
          <Link href="/admin" className="text-white font-medium transition-smooth hover:opacity-80 focus-ring rounded-lg inline-block">
            ← イベント一覧へ
          </Link>
        </main>
      );
    }
    notFound();
  }

  const origin = getAppOrigin();
  const participantUrl = `${origin}/e/${event.event_token}`;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-[var(--text-muted)] text-sm transition-smooth hover:text-white focus-ring rounded-lg py-1">
          ← 一覧
        </Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {event.name}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1 break-all">
            参加者URL: {participantUrl}
          </p>
        </div>
        <a
          href={participantUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-[var(--border-light)] px-4 py-2 text-sm font-medium transition-smooth hover:bg-[var(--surface-elevated)] active:scale-[0.98] focus-ring"
        >
          プレビュー
        </a>
      </div>
      <AdminEventTabs eventId={eventId} event={event} participantUrl={participantUrl} />
    </main>
  );
}
