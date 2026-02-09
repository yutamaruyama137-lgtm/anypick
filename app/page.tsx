import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-950">
      <h1 className="font-display text-4xl font-bold tracking-tight text-white mb-2">
        AnyPick
      </h1>
      <p className="text-zinc-400 mb-8">イベントフォト＆応募</p>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Link
          href="/admin"
          className="rounded-xl bg-brand-500 px-6 py-3 font-medium text-black hover:bg-brand-400 transition"
        >
          主催者ログイン
        </Link>
        <Link
          href="/admin/login"
          className="rounded-xl border border-zinc-600 px-6 py-3 font-medium text-zinc-300 hover:bg-surface-850 transition"
        >
          新規登録
        </Link>
      </div>
      <p className="text-zinc-500 text-sm mt-4 text-center">
        参加者はイベントのQRからアクセス
      </p>
      <p className="text-zinc-600 text-xs mt-2 text-center max-w-xs">
        初めての主催者も「新規登録」→ メールアドレス入力でアカウント作成されます
      </p>
    </main>
  );
}
