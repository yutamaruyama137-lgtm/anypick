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
  const error = searchParams.get("error");

  useEffect(() => {
    fetch("/api/debug/supabase")
      .then((r) => r.json())
      .then((d) => setDebug(d))
      .catch(() => setDebug({ ok: false, message: "接続確認の取得に失敗しました" }));
  }, []);

  // ログイン: バリデーションだけ。通れば form の通常 POST で送信 → サーバーが 302 で /admin に飛ばす（確実に遷移）
  const handleLoginSubmit = (e: React.FormEvent) => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      e.preventDefault();
      setMessage(`パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`);
      return;
    }
    setMessage(null);
    // そのまま送信（form の action/method で POST → 302 をブラウザが追って /admin へ）
  };

  // 新規登録は従来どおり fetch
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegister(e);
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

  const handleSubmit = mode === "login" ? handleLoginSubmit : handleRegisterSubmit;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex gap-1 p-1 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setMessage(null); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-smooth ${
              mode === "login"
                ? "bg-white text-black shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setMessage(null); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-smooth ${
              mode === "register"
                ? "bg-white text-black shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            新規登録
          </button>
        </div>

        <h1 className="font-display text-xl font-bold text-white mb-2 text-center">
          {mode === "login" ? "主催者ログイン" : "主催者新規登録"}
        </h1>
        <p className={`text-[var(--text-muted)] text-sm text-center ${mode === "login" ? "mb-2" : "mb-6"}`}>
          {mode === "login"
            ? "メールアドレスとパスワードでログイン"
            : "パスワードは8文字以上で設定してください"}
        </p>
        {mode === "login" && (
          <p className="text-[var(--text-dim)] text-xs text-center mb-6">
            入力して「ログイン」を押すと、<strong className="text-[var(--text-muted)]">イベント一覧（ダッシュボード）</strong>が開きます。
          </p>
        )}

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
        {error === "oauth" && (
          <p className="text-amber-400 text-sm mb-4 text-center">
            Google ログインでエラーが発生しました。もう一度お試しください。
          </p>
        )}
        {error === "login_failed" && (
          <p className="text-amber-400 text-sm mb-4 text-center">
            {searchParams.get("message")
              ? decodeURIComponent(searchParams.get("message") ?? "")
              : "ログインに失敗しました。"}
          </p>
        )}

        {/* Google ログイン（ログイン・新規登録どちらでも同じエンドポイント） */}
        <div className="mb-4">
          <a
            href="/api/admin/auth/google"
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-[var(--border-light)] bg-[var(--surface-elevated)] py-3 font-medium text-white transition-smooth hover:bg-[var(--surface)] active:scale-[0.98] focus-ring"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google でログイン
          </a>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--bg)] px-2 text-[var(--text-dim)]">または</span>
          </div>
        </div>

        <form
          action={mode === "login" ? "/api/admin/auth/login" : undefined}
          method="post"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {mode === "login" && searchParams.get("next") && (
            <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
          )}
          <div>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 text-white placeholder-[var(--text-dim)] transition-smooth focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "login" ? "パスワード" : "パスワード（8文字以上）"}
              required
              minLength={mode === "register" ? PASSWORD_MIN_LENGTH : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 text-white placeholder-[var(--text-dim)] transition-smooth focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            {mode === "register" && (
              <p className="text-[var(--text-dim)] text-xs mt-1">8文字以上で設定してください</p>
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
                className="w-full rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 text-white placeholder-[var(--text-dim)] transition-smooth focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-white py-3 font-semibold text-black transition-smooth hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus-ring"
          >
            {loading
              ? "処理中…"
              : mode === "login"
                ? "ログイン"
                : "新規登録"}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm text-center transition-smooth ${message.includes("しました") || message.includes("しています") ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        <p className="mt-6 text-center space-x-4">
          <Link href="/admin/login/debug" className="text-[var(--text-muted)] text-sm transition-smooth hover:text-white">
            ログイン状態デバッグ
          </Link>
          <Link href="/" className="text-[var(--text-muted)] text-sm transition-smooth hover:text-white">
            トップへ
          </Link>
        </p>

        {/* Supabase 接続確認（デバッグ） */}
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <p className="text-[var(--text-dim)] text-xs mb-2">Supabase 接続確認</p>
          {debug === null ? (
            <p className="text-[var(--text-dim)] text-xs">確認中…</p>
          ) : (
            <div className="text-xs space-y-1">
              <p className={debug.ok ? "text-green-400" : "text-red-400"}>
                {debug.message}
              </p>
              {debug.env && (
                <p className="text-[var(--text-dim)]">
                  URL: {debug.env.url ? "✓" : "✗"} / anon: {debug.env.anonKey ? "✓" : "✗"} / service_role: {debug.env.serviceRoleKey ? "✓" : "✗"}
                </p>
              )}
              {debug.error && (
                <p className="text-amber-400 break-all">{debug.error}</p>
              )}
              {debug.hint && (
                <p className="text-[var(--text-dim)] italic">{debug.hint}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
