import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ event_token: string }> }
) {
  const { event_token } = await params;
  const supabase = createServiceRoleClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, name, starts_at, ends_at, rules_text, share_caption_template, share_hashtags, share_targets, submission_max_per_person, retake_max_count, require_ticket_code, consent_template_id"
    )
    .eq("event_token", event_token)
    .eq("status", "active")
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const policy = {
    max_submissions_per_person: event.submission_max_per_person,
    allow_retake_count: event.retake_max_count,
    max_captures: Math.max(1, event.retake_max_count), // 撮影は最大 N 回（1回目 + 撮り直し N-1 回）
    require_ticket_code: event.require_ticket_code,
  };

  let consent_template: { id: string; version: number; text: string } | null = null;
  if (event.consent_template_id) {
    const { data: ct } = await supabase
      .from("consent_templates")
      .select("id, version, text")
      .eq("id", event.consent_template_id)
      .single();
    if (ct) consent_template = { id: ct.id, version: ct.version, text: ct.text };
  }

  let frame_active: { id: string; image_url: string } | null = null;
  const { data: frame } = await supabase
    .from("frames")
    .select("id, storage_key")
    .eq("event_id", event.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (frame) {
    const { data: signed } = await supabase.storage
      .from("frames")
      .createSignedUrl(frame.storage_key, 3600);
    if (signed?.signedUrl) {
      frame_active = { id: frame.id, image_url: signed.signedUrl };
    }
  }

  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      rules_text: event.rules_text,
      share_caption_template: event.share_caption_template,
      share_hashtags: event.share_hashtags ?? [],
      share_targets: event.share_targets ?? ["instagram", "x"],
      frame_active,
      consent_template,
      submission_policy: policy,
    },
  });
}
