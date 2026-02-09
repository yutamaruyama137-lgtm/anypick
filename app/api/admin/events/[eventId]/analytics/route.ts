import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

async function getTenantId(supabaseAuth: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return null;
  const admin = createServiceRoleClient();
  const { data: au } = await admin.from("admin_users").select("tenant_id").eq("id", user.id).single();
  return au?.tenant_id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const tenant_id = await getTenantId(supabase);
  if (!tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const admin = createServiceRoleClient();
  const { data: event } = await admin.from("events").select("id").eq("id", eventId).eq("tenant_id", tenant_id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const to = searchParams.get("to") || new Date().toISOString();

  const { data: metrics } = await admin
    .from("metrics_events")
    .select("type, platform, created_at")
    .eq("event_id", eventId)
    .gte("created_at", from)
    .lt("created_at", to);

  const summary = {
    scan: 0,
    camera_complete: 0,
    save_click: 0,
    outbound_click: { instagram: 0, x: 0 } as Record<string, number>,
    submit_complete: 0,
  };
  (metrics ?? []).forEach((m) => {
    if (m.type === "scan") summary.scan++;
    else if (m.type === "camera_complete") summary.camera_complete++;
    else if (m.type === "save_click") summary.save_click++;
    else if (m.type === "outbound_click" && m.platform) {
      summary.outbound_click[m.platform] = (summary.outbound_click[m.platform] || 0) + 1;
    } else if (m.type === "submit_complete") summary.submit_complete++;
  });

  const { count: consentTotal } = await admin
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .gte("created_at", from)
    .lt("created_at", to)
    .eq("status", "valid");
  const { count: consentAgree } = await admin
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .gte("created_at", from)
    .lt("created_at", to)
    .eq("status", "valid")
    .eq("consent_agree_reuse", true);
  const consent_agree_rate =
    typeof consentTotal === "number" && consentTotal > 0
      ? (consentAgree ?? 0) / consentTotal
      : 0;

  return NextResponse.json({
    summary: { ...summary, consent_agree_rate: Math.round(consent_agree_rate * 100) / 100 },
    timeseries: [],
  });
}
