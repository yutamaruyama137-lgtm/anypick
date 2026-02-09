import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Google OAuth を開始し、Supabase の認証ページへリダイレクトする。
 * 認証後は Supabase が /admin/callback に code 付きでリダイレクトし、
 * コールバックで exchangeCodeForSession のあと /admin へ飛ぶ。
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const redirectTo = `${origin}/admin/callback`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=oauth&message=${encodeURIComponent(error.message)}`, req.url)
    );
  }
  if (!data?.url) {
    return NextResponse.redirect(new URL("/admin/login?error=oauth", req.url));
  }

  return NextResponse.redirect(data.url);
}
