import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=no_code", req.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/admin/login?error=exchange", req.url));
  }

  const redirectTo = new URL(next, req.url);
  const response = NextResponse.redirect(redirectTo, 302);
  const isSecure = req.url.startsWith("https://");

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const opts: CookieOptions = {
            path: (options?.path as string) ?? "/",
            maxAge: (options?.maxAge as number) ?? 60 * 60 * 24 * 7,
            httpOnly: (options?.httpOnly as boolean) ?? true,
            secure: (options?.secure as boolean) ?? isSecure,
            sameSite: ((options?.sameSite as "lax" | "strict" | "none") || "lax") as "lax" | "strict" | "none",
          };
          response.cookies.set(name, value, opts);
        });
      },
    },
  });

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

  return response;
}
