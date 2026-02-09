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
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const tenant_id = await getTenantId(supabase);
  if (!tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const admin = createServiceRoleClient();
  const { data: event } = await admin.from("events").select("id").eq("id", eventId).eq("tenant_id", tenant_id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: list } = await admin.from("qr_sources").select("*").eq("event_id", eventId);
  return NextResponse.json({ qr_sources: list ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const tenant_id = await getTenantId(supabase);
  if (!tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const admin = createServiceRoleClient();
  const { data: event } = await admin.from("events").select("id, event_token").eq("id", eventId).eq("tenant_id", tenant_id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { code: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const code = (body.code || "default").trim().replace(/\s/g, "_");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const { data: qr, error } = await admin
    .from("qr_sources")
    .insert({ event_id: eventId, code, label: body.label ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ qr_source: qr });
}
