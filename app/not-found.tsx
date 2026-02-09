import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)] animate-fade-in">
      <h1 className="font-display text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-[var(--text-muted)] mb-6">このページは存在しません。</p>
      <p className="text-[var(--text-dim)] text-sm mb-8 text-center max-w-sm">
        URLを確認するか、下のリンクからトップまたは管理画面へお進みください。
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="rounded-2xl bg-white px-6 py-3 font-semibold text-black text-center transition-smooth hover:bg-zinc-200 active:scale-[0.98] focus-ring"
        >
          トップへ
        </Link>
        <Link
          href="/admin"
          className="rounded-2xl border border-[var(--border-light)] px-6 py-3 font-medium text-center transition-smooth hover:bg-[var(--surface-elevated)] active:scale-[0.98] focus-ring"
        >
          管理画面へ
        </Link>
      </div>
    </main>
  );
}
