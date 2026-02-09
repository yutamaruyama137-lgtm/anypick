"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Me = { user: { id: string; email: string } } | { user: null };
type SupabaseDebug = {
  ok: boolean;
  message: string;
  env?: { url: boolean; anonKey: boolean; serviceRoleKey: boolean };
  error?: string;
};

export default function AdminLoginDebugPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<SupabaseDebug | null>(null);
  const [cookieNames, setCookieNames] = useState<string[]>([]);

  useEffect(() => {
    // 認証状態（API がクッキーを見る）
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setMe(d))
      .catch((e) => setMeError(String(e)));

    fetch("/api/debug/supabase")
      .then((r) => r.json())
      .then(setSupabase)
      .catch(() => setSupabase({ ok: false, message: "取得失敗" }));

    // ブラウザから見えるクッキー名のみ（HttpOnly は見えない）
    setCookieNames(
      document.cookie ? document.cookie.split(";").map((s) => s.trim().split("=")[0] || "") : []
    );
  }, []);

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-xl font-bold text-white mb-2">ログイン状態デバッグ</h1>
      <p className="text-zinc-500 text-sm mb-6">
        このページは認証が取れているか・API がどう見ているかを確認するためのものです。
      </p>

      <section className="rounded-xl border border-zinc-700 bg-surface-900 p-4 mb-4">
        <h2 className="text-sm font-medium text-zinc-400 mb-2">認証状態（/api/admin/me）</h2>
        {meError && <p className="text-red-400 text-sm">{meError}</p>}
        {me === null && !meError && <p className="text-zinc-500 text-sm">取得中…</p>}
        {me && (
          <pre className="text-sm text-white bg-zinc-800 p-3 rounded overflow-x-auto">
            {JSON.stringify(me, null, 2)}
          </pre>
        )}
        {me?.user ? (
          <p className="text-green-400 text-sm mt-2">✓ ログイン済みです。ダッシュボードへ進めます。</p>
        ) : me && !me.user ? (
          <p className="text-amber-400 text-sm mt-2">✗ 未ログイン（またはセッション切れ）</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-zinc-700 bg-surface-900 p-4 mb-4">
        <h2 className="text-sm font-medium text-zinc-400 mb-2">Supabase 接続</h2>
        {supabase === null && <p className="text-zinc-500 text-sm">取得中…</p>}
        {supabase && (
          <>
            <p className={supabase.ok ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
              {supabase.message}
            </p>
            {supabase.error && (
              <p className="text-amber-400 text-xs mt-1 break-all">{supabase.error}</p>
            )}
          </>
        )}
      </section>

      <section className="rounded-xl border border-zinc-700 bg-surface-900 p-4 mb-4">
        <h2 className="text-sm font-medium text-zinc-400 mb-2">クッキー（名前のみ・JS から見えるもの）</h2>
        <p className="text-zinc-500 text-xs mb-2">
          Supabase のセッションは HttpOnly のため、ここには出ない場合があります。
        </p>
        {cookieNames.length === 0 ? (
          <p className="text-zinc-500 text-sm">（なし）</p>
        ) : (
          <ul className="text-sm text-white list-disc list-inside">
            {cookieNames.map((name) => (
              <li key={name}>{name || "(空)"}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex gap-3">
        <Link
          href="/admin"
          className="rounded-xl bg-brand-500 px-4 py-2 font-medium text-black hover:bg-brand-400"
        >
          ダッシュボードへ
        </Link>
        <Link
          href="/admin/login"
          className="rounded-xl border border-zinc-600 px-4 py-2 text-zinc-300 hover:bg-zinc-800"
        >
          ログイン画面へ
        </Link>
      </div>
    </main>
  );
}
