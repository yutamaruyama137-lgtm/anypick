"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type DebugStatus = {
  ok: boolean;
  message: string;
  env?: { url: boolean; anonKey: boolean; serviceRoleKey: boolean };
  error?: string;
  hint?: string;
  db?: string;
} | null;

type Mode = "login" | "register";

const PASSWORD_MIN_LENGTH = 8;

export default function AdminLoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugStatus>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  useEffect(() => {
    fetch("/api/debug/supabase")
      .then((r) => r.json())
      .then((d) => setDebug(d))
      .catch(() => setDebug({ ok: false, message: "接続確認の取得に失敗しました" }));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) {
      setMessage(`パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`);
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ログインに失敗しました");
      // フルリロードで遷移（セッションクッキーを送る）
      window.location.href = "/admin";
      return;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) {
      setMessage(`パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`);
      return;
    }
    if (password !== passwordConfirm) {
      setMessage("パスワードが一致しません");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登録に失敗しました");
      if (data.requiresConfirmation) {
        setMessage("確認メールを送信しました。メール内のリンクをクリックしてからログインしてください。");
      } else {
        setMessage("登録しました。ログインしています…");
        window.location.href = "/admin";
        return;
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = mode === "login" ? handleLogin : handleRegister;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setMessage(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-t-xl border-b-2 transition ${
              mode === "login"
                ? "border-brand-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-400"
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setMessage(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-t-xl border-b-2 transition ${
              mode === "register"
                ? "border-brand-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-400"
            }`}
          >
            新規登録
          </button>
        </div>

        <h1 className="font-display text-xl font-bold text-white mb-2 text-center">
          {mode === "login" ? "主催者ログイン" : "主催者新規登録"}
        </h1>
        <p className="text-zinc-500 text-sm text-center mb-6">
          {mode === "login"
            ? "メールアドレスとパスワードでログイン"
            : "パスワードは8文字以上で設定してください"}
        </p>

        {error === "no_code" && (
          <p className="text-amber-400 text-sm mb-4 text-center">
            リンクが無効です。
          </p>
        )}
        {error === "exchange" && (
          <p className="text-amber-400 text-sm mb-4 text-center">
            セッションの取得に失敗しました。
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-700 bg-surface-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "login" ? "パスワード" : "パスワード（8文字以上）"}
              required
              minLength={mode === "register" ? PASSWORD_MIN_LENGTH : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-zinc-700 bg-surface-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
            />
            {mode === "register" && (
              <p className="text-zinc-500 text-xs mt-1">8文字以上で設定してください</p>
            )}
          </div>
          {mode === "register" && (
            <div>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="パスワード（再入力）"
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-zinc-700 bg-surface-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-500 py-3 font-medium text-black disabled:opacity-50"
          >
            {loading
              ? "処理中…"
              : mode === "login"
                ? "ログイン"
                : "新規登録"}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm text-center ${message.includes("しました") || message.includes("しています") ? "text-green-400" : "text-red-400"}`}>
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
