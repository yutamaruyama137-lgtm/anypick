import Link from "next/link";
import { AddToHomeScreenHint } from "./components/AddToHomeScreenHint";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)] animate-fade-in">
      <h1 className="font-display text-4xl font-bold tracking-tight text-white mb-2">
        AnyPick
      </h1>
      <p className="text-[var(--text-muted)] text-base mb-6">イベントフォト＆応募</p>
      <AddToHomeScreenHint />
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto mt-2">
        <Link
          href="/admin"
          className="rounded-2xl bg-white py-3.5 px-6 font-semibold text-black text-center transition-smooth hover:bg-zinc-200 active:scale-[0.98] focus-ring"
        >
          主催者ログイン
        </Link>
        <Link
          href="/admin/login"
          className="rounded-2xl border border-[var(--border-light)] py-3.5 px-6 font-medium text-white text-center transition-smooth hover:bg-[var(--surface-elevated)] active:scale-[0.98] focus-ring"
        >
          新規登録
        </Link>
      </div>
      <p className="text-[var(--text-dim)] text-sm mt-8 text-center">
        参加者はイベントのQRからアクセス
      </p>
      <p className="text-[var(--text-dim)] text-xs mt-2 text-center max-w-xs">
        初めての主催者も「新規登録」→ メールアドレスとパスワード（8文字以上）でアカウント作成
      </p>
    </main>
  );
}
