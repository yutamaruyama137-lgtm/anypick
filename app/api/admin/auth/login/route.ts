import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

export async function POST(req: NextRequest) {
  let email: string;
  let password: string;
  let nextPath = "";
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let body: { email?: string; password?: string; next?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
    nextPath = typeof body.next === "string" ? body.next.trim() : "";
  } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    email = (form.get("email") ?? "").toString().trim().toLowerCase();
    password = (form.get("password") ?? "").toString();
    nextPath = (form.get("next") ?? "").toString().trim();
  } else {
    return NextResponse.json({ error: "Content-Type not supported" }, { status: 400 });
  }
  if (!email) return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  if (!password) return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "サーバー設定エラー" }, { status: 500 });
  }

  // 成功時は 302 でリダイレクト（next があればそのURL、なければ /admin）。クッキーを付与
  const safeNext =
    nextPath.startsWith("/admin") && !nextPath.startsWith("//") && !nextPath.includes("\n")
      ? nextPath
      : "/admin";
  const redirectUrl = new URL(safeNext, req.url);
  const response = NextResponse.redirect(redirectUrl, 302);
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
            maxAge: (options?.maxAge as number) ?? 60 * 60 * 24 * 7, // 7日
            httpOnly: (options?.httpOnly as boolean) ?? true,
            secure: (options?.secure as boolean) ?? isSecure,
            sameSite: ((options?.sameSite as "lax" | "strict" | "none") || "lax") as "lax" | "strict" | "none",
          };
          response.cookies.set(name, value, opts);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  const isFormPost = !(req.headers.get("content-type") ?? "").includes("application/json");
  if (error) {
    if (isFormPost) {
      const to = new URL("/admin/login", req.url);
      to.searchParams.set("error", "login_failed");
      to.searchParams.set("message", encodeURIComponent(error.message));
      return NextResponse.redirect(to, 302);
    }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (!data.session) {
    if (isFormPost) {
      return NextResponse.redirect(new URL("/admin/login?error=login_failed", req.url), 302);
    }
    return NextResponse.json({ error: "ログインに失敗しました" }, { status: 401 });
  }

  // ダッシュボードは admin_users の存在も見る。未登録なら OAuth コールバックと同様に tenant + admin_user を作成
  const user = data.user;
  if (user?.id && user?.email) {
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
      if (!tenantErr && newTenant) {
        await admin.from("admin_users").insert({
          id: user.id,
          tenant_id: newTenant.id,
          email: user.email,
          role: "organizer_admin",
        });
      }
    }
  }

  return response;
}
