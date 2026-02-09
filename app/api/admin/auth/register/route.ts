import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

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
  if (password.length < 8) return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });

  // 確認メールのリンク先は「今アクセスしているサイト」にする（本番なら本番URL、localhost なら localhost）
  const requestUrl = new URL(req.url);
  const redirectTo = `${requestUrl.origin}/admin/callback`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data.user) {
    return NextResponse.json({ error: "ユーザーを作成できませんでした" }, { status: 500 });
  }

  const admin = createServiceRoleClient();
  const { data: existing } = await admin
    .from("admin_users")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existing) {
    const { data: newTenant, error: tenantErr } = await admin
      .from("tenants")
      .insert({ name: data.user.email ?? email })
      .select("id")
      .single();
    if (tenantErr || !newTenant) {
      return NextResponse.json({ error: "テナントの作成に失敗しました" }, { status: 500 });
    }
    await admin.from("admin_users").insert({
      id: data.user.id,
      tenant_id: newTenant.id,
      email: data.user.email ?? email,
      role: "organizer_admin",
    });
  }

  return NextResponse.json({
    ok: true,
    message: "登録しました。ログインしてください。",
    requiresConfirmation: !data.session,
  });
}
