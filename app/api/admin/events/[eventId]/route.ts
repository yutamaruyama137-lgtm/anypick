import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAdminTenantId } from "@/lib/admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const tenant_id = await getAdminTenantId();
  if (!tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const admin = createServiceRoleClient();
  const { data: event, error } = await admin
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("tenant_id", tenant_id)
    .single();

  if (error || !event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const tenant_id = await getAdminTenantId();
  if (!tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = [
    "name", "starts_at", "ends_at", "venue_name", "rules_text",
    "share_caption_template", "share_hashtags", "share_targets",
    "submission_max_per_person", "retake_max_count", "require_ticket_code",
    "status", "consent_template_id",
  ];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) update[k] = body[k];
  }
  update.updated_at = new Date().toISOString();

  const admin = createServiceRoleClient();
  const { data: event, error } = await admin
    .from("events")
    .update(update)
    .eq("id", eventId)
    .eq("tenant_id", tenant_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event });
}
