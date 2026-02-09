import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAppOrigin } from "@/lib/app-url";
import { AdminEventTabs } from "./AdminEventTabs";
import { ensureAdmin } from "@/lib/admin-auth";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const { adminUser } = await ensureAdmin(`/admin/events/${eventId}`);
  const admin = createServiceRoleClient();

  const { data: event } = await admin
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("tenant_id", adminUser.tenant_id)
    .single();
  if (!event) notFound();

  const origin = getAppOrigin();
  const participantUrl = `${origin}/e/${event.event_token}`;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-400 text-sm">
          ← 一覧
        </Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {event.name}
          </h1>
          <p className="text-zinc-500 text-sm mt-1 break-all">
            参加者URL: {participantUrl}
          </p>
        </div>
        <a
          href={participantUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-zinc-600 px-4 py-2 text-sm hover:bg-surface-850"
        >
          プレビュー
        </a>
      </div>
      <AdminEventTabs eventId={eventId} event={event} participantUrl={participantUrl} />
    </main>
  );
}
