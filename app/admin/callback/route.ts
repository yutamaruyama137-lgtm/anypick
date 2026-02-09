import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=no_code", req.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/admin/login?error=exchange", req.url));
  }

  const user = data.user;
  if (!user?.id || !user.email) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const admin = createServiceRoleClient();
  const { data: existing } = await admin
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    const { data: newTenant, error: tenantErr } = await admin
      .from("tenants")
      .insert({ name: user.email })
      .select("id")
      .single();
    if (tenantErr || !newTenant) {
      return NextResponse.redirect(new URL("/admin/login?error=tenant", req.url));
    }
    await admin.from("admin_users").insert({
      id: user.id,
      tenant_id: newTenant.id,
      email: user.email,
      role: "organizer_admin",
    });
  }

  return NextResponse.redirect(new URL(next, req.url));
}
