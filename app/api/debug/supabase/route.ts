import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Supabase 接続確認用（デバッグ）
 * 環境変数の有無と DB 疎通を返す。キー値は返さない。
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const env = {
    url: !!url,
    anonKey: !!anon,
    serviceRoleKey: !!serviceRole,
  };

  if (!url || !anon || !serviceRole) {
    return NextResponse.json({
      ok: false,
      message: "環境変数が不足しています",
      env,
      error: "Missing env: " + [
        !url && "NEXT_PUBLIC_SUPABASE_URL",
        !anon && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        !serviceRole && "SUPABASE_SERVICE_ROLE_KEY",
      ].filter(Boolean).join(", "),
    });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json({
        ok: false,
        message: "DB クエリでエラー",
        env,
        error: error.message,
        hint: "スキーマ投入（db/01-schema.sql）が済んでいるか確認してください。",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Supabase 接続OK",
      env,
      db: "tenants テーブルに疎通できました",
      rowCount: Array.isArray(data) ? data.length : 0,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: "接続エラー",
      env,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
