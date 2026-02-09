import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type MetricType = "camera_complete" | "save_click" | "outbound_click";

export async function POST(req: NextRequest) {
  let body: {
    session_id: string;
    events: Array<{ type: MetricType; ts?: string; platform?: string }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, events } = body;
  if (!session_id || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { error: "session_id and events array required" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data: session } = await supabase
    .from("user_sessions")
    .select("event_id, qr_source_id")
    .eq("id", session_id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const rows = events
    .filter((e) =>
      ["camera_complete", "save_click", "outbound_click"].includes(e.type)
    )
    .map((e) => ({
      event_id: session.event_id,
      session_id,
      type: e.type,
      platform: e.platform ?? null,
      qr_source_id: session.qr_source_id ?? undefined,
    }));

  if (rows.length > 0) {
    await supabase.from("metrics_events").insert(rows);
  }

  return NextResponse.json({ ok: true });
}
