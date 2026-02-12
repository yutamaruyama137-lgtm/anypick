"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "@/app/components/LoadingSpinner";

type Mode = "login" | "register";

const PASSWORD_MIN_LENGTH = 8;

export default function AdminLoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // ログイン: fetch で送信し、ローディング表示を出してから 302 でリダイレクト
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) {
      setMessage(`パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`);
      return;
    }
    setMessage(null);
    setLoading(true);
    const next = searchParams.get("next") ?? "";
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(next && { next }),
        }),
        redirect: "manual",
        credentials: "include",
      });
      if (res.type === "opaqueredirect" || res.status === 302) {
        const url = res.headers.get("Location") ?? "/admin";
        setIsRedirecting(true);
        requestAnimationFrame(() => {
          window.location.href = url;
        });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage((data.error as string) || "ログインに失敗しました。");
        return;
      }
      setIsRedirecting(true);
      requestAnimationFrame(() => {
        window.location.href = "/admin";
      });
    } catch {
      setMessage("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
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
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)] animate-fade-in">
          <LoadingSpinner
            title="ログインしました"
            subtitle="リダイレクト中…"
          />
        </div>
      )}
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
        {error === "login_failed" && (
          <p className="text-amber-400 text-sm mb-4 text-center">
            {searchParams.get("message")
              ? decodeURIComponent(searchParams.get("message") ?? "")
              : "ログインに失敗しました。"}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full rounded-2xl bg-white py-3 font-semibold text-black transition-smooth hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus-ring flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="w-5 h-5 animate-spin flex-shrink-0 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            )}
            {loading
              ? mode === "login"
                ? "ログイン中…"
                : "処理中…"
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

        <p className="mt-6 text-center">
          <Link href="/" className="text-[var(--text-muted)] text-sm transition-smooth hover:text-white">
            トップへ
          </Link>
        </p>
      </div>
    </main>
  );
}
