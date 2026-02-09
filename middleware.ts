import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

function toCookieOptions(
  options: Record<string, unknown> | undefined,
  isSecure: boolean
): CookieOptions {
  return {
    path: (options?.path as string) ?? "/",
    maxAge: (options?.maxAge as number) ?? 60 * 60 * 24 * 7,
    httpOnly: (options?.httpOnly as boolean) ?? true,
    secure: (options?.secure as boolean) ?? isSecure,
    sameSite: ((options?.sameSite as "lax" | "strict" | "none") || "lax") as "lax" | "strict" | "none",
  };
}

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  const isSecure = req.nextUrl.protocol === "https:";

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, toCookieOptions(options, isSecure));
          });
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    // セッション更新に失敗してもリクエストは通過させる
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
