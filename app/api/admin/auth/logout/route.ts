import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/admin/login", req.url), 302);
  }

  const response = NextResponse.redirect(new URL("/admin/login", req.url), 302);
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
                maxAge: (options.maxAge as number) ?? 0,
                httpOnly: (options.httpOnly as boolean) ?? true,
                secure: (options.secure as boolean) ?? req.url.startsWith("https://"),
                sameSite: ((options.sameSite as "lax" | "strict" | "none") || "lax") as "lax" | "strict" | "none",
              }
            : { path: "/", maxAge: 0 };
          response.cookies.set(name, value, opts);
        });
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}
