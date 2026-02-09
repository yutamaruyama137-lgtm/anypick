import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  let body: {
    session_id: string;
    media_asset_id: string;
    consent?: { agree_reuse?: boolean };
    contact?: { email?: string };
    client_meta?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, media_asset_id, consent, contact } = body;
  if (!session_id || !media_asset_id) {
    return NextResponse.json(
      { error: "session_id and media_asset_id required" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("user_sessions")
    .select("event_id")
    .eq("id", session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const { data: asset } = await supabase
    .from("media_assets")
    .select("id")
    .eq("id", media_asset_id)
    .eq("session_id", session_id)
    .single();

  if (!asset) {
    return NextResponse.json({ error: "Invalid media_asset" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("event_id", session.event_id)
    .eq("session_id", session_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("consent_template_id")
    .eq("id", session.event_id)
    .single();

  let consent_version: number | null = null;
  if (event?.consent_template_id) {
    const { data: ct } = await supabase
      .from("consent_templates")
      .select("version")
      .eq("id", event.consent_template_id)
      .single();
    if (ct) consent_version = ct.version;
  }

  const { data: sub, error: subError } = await supabase
    .from("submissions")
    .insert({
      event_id: session.event_id,
      session_id,
      media_asset_id,
      contact_email: contact?.email ?? null,
      consent_agree_reuse: consent?.agree_reuse ?? false,
      consent_template_id: event?.consent_template_id ?? null,
      consent_version,
    })
    .select("id")
    .single();

  if (subError || !sub) {
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }

  await supabase.from("metrics_events").insert({
    event_id: session.event_id,
    session_id,
    type: "submit_complete",
  });

  return NextResponse.json({
    submission_id: sub.id,
    locked: true,
  });
}
