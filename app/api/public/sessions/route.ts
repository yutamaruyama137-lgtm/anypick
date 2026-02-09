import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  let body: { event_token: string; qr_source_code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { event_token, qr_source_code } = body;
  if (!event_token) {
    return NextResponse.json({ error: "event_token required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("event_token", event_token)
    .eq("status", "active")
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  let qr_source_id: string | null = null;
  if (qr_source_code) {
    const { data: qr } = await supabase
      .from("qr_sources")
      .select("id")
      .eq("event_id", event.id)
      .eq("code", qr_source_code)
      .single();
    if (qr) qr_source_id = qr.id;
  }

  const { data: session, error: sessionError } = await supabase
    .from("user_sessions")
    .insert({
      event_id: event.id,
      qr_source_id: qr_source_id ?? undefined,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("event_id", event.id)
    .eq("session_id", session.id)
    .maybeSingle();

  const already_submitted = !!existing;

  await supabase.from("metrics_events").insert({
    event_id: event.id,
    session_id: session.id,
    type: "scan",
    qr_source_id: qr_source_id ?? undefined,
  });

  return NextResponse.json({
    session_id: session.id,
    already_submitted,
  });
}
