import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: { email: string; password: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email) return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  if (!password) return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (!data.session) {
    return NextResponse.json({ error: "ログインに失敗しました" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, message: "ログインしました" });
}
