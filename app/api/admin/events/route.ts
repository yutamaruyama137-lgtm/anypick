import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

async function getOrCreateAdminUser(admin: ReturnType<typeof createServiceRoleClient>, userId: string, email: string | undefined) {
  let { data: adminUser } = await admin
    .from("admin_users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();
  if (!adminUser && email) {
    const { data: newTenant, error: tenantErr } = await admin
      .from("tenants")
      .insert({ name: email })
      .select("id")
      .single();
    if (!tenantErr && newTenant) {
      await admin.from("admin_users").insert({
        id: userId,
        tenant_id: newTenant.id,
        email,
        role: "organizer_admin",
      });
      adminUser = { tenant_id: newTenant.id };
    }
  }
  return adminUser;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceRoleClient();
  const adminUser = await getOrCreateAdminUser(admin, user.id, user.email ?? undefined);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: events, error } = await admin
    .from("events")
    .select("id, name, event_token, status, starts_at, ends_at, created_at")
    .eq("tenant_id", adminUser.tenant_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: events ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceRoleClient();
  const adminUser = await getOrCreateAdminUser(admin, user.id, user.email ?? undefined);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { name: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { name } = body;
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const event_token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);

  const { data: event, error } = await admin
    .from("events")
    .insert({
      tenant_id: adminUser.tenant_id,
      event_token,
      name: name.trim(),
    })
    .select("id, name, event_token, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event });
}
