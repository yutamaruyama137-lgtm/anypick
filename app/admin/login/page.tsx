"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type DebugStatus = {
  ok: boolean;
  message: string;
  env?: { url: boolean; anonKey: boolean; serviceRoleKey: boolean };
  error?: string;
  hint?: string;
  db?: string;
} | null;

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugStatus>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    fetch("/api/debug/supabase")
      .then((r) => r.json())
      .then((d) => setDebug(d))
      .catch(() => setDebug({ ok: false, message: "接続確認の取得に失敗しました" }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "送信に失敗しました");
      setMessage("メールを送信しました。リンクをクリックしてログインしてください。");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-white mb-2 text-center">
          主催者ログイン / 新規登録
        </h1>
        <p className="text-zinc-500 text-sm text-center mb-6">
          初めての方はメールアドレスを入力するだけで新規登録されます
        </p>
        {error === "no_code" && (
          <p className="text-amber-400 text-sm mb-4 text-center">
            リンクが無効です。再度メールからアクセスしてください。
          </p>
        )}
        {error === "exchange" && (
          <p className="text-amber-400 text-sm mb-4 text-center">
            セッションの取得に失敗しました。もう一度お試しください。
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            required
            className="w-full rounded-xl border border-zinc-700 bg-surface-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-500 py-3 font-medium text-black disabled:opacity-50"
          >
            {loading ? "送信中…" : "マジックリンクを送信"}
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-sm text-center ${message.startsWith("メール") ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}
        <p className="mt-6 text-center">
          <Link href="/" className="text-zinc-500 text-sm hover:text-zinc-400">
            トップへ
          </Link>
        </p>

        {/* Supabase 接続確認（デバッグ） */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <p className="text-zinc-600 text-xs mb-2">Supabase 接続確認</p>
          {debug === null ? (
            <p className="text-zinc-500 text-xs">確認中…</p>
          ) : (
            <div className="text-xs space-y-1">
              <p className={debug.ok ? "text-green-400" : "text-red-400"}>
                {debug.message}
              </p>
              {debug.env && (
                <p className="text-zinc-500">
                  URL: {debug.env.url ? "✓" : "✗"} / anon: {debug.env.anonKey ? "✓" : "✗"} / service_role: {debug.env.serviceRoleKey ? "✓" : "✗"}
                </p>
              )}
              {debug.error && (
                <p className="text-amber-400 break-all">{debug.error}</p>
              )}
              {debug.hint && (
                <p className="text-zinc-500 italic">{debug.hint}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
