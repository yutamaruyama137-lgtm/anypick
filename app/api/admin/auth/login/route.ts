import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

export async function POST(req: NextRequest) {
  let email: string;
  let password: string;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let body: { email?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
  } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    email = (form.get("email") ?? "").toString().trim().toLowerCase();
    password = (form.get("password") ?? "").toString();
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

  // 成功時は 302 で /admin へリダイレクト（クッキーを付与）。ブラウザがそのまま遷移するので確実
  const redirectUrl = new URL("/admin", req.url);
  const response = NextResponse.redirect(redirectUrl, 302);
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const opts: CookieOptions = options
            ? {
                path: (options.path as string) ?? "/",
                maxAge: options.maxAge as number | undefined,
                httpOnly: options.httpOnly as boolean | undefined,
                secure: options.secure as boolean | undefined,
                sameSite: (options.sameSite as "lax" | "strict" | "none") || "lax",
              }
            : { path: "/" };
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

  return response;
}
