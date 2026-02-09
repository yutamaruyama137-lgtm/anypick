import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-950">
      <h1 className="font-display text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-zinc-400 mb-6">このページは存在しません。</p>
      <p className="text-zinc-500 text-sm mb-8 text-center max-w-sm">
        URLを確認するか、下のリンクからトップまたは管理画面へお進みください。
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="rounded-xl bg-brand-500 px-6 py-3 font-medium text-black text-center"
        >
          トップへ
        </Link>
        <Link
          href="/admin"
          className="rounded-xl border border-zinc-600 px-6 py-3 text-center hover:bg-zinc-800"
        >
          管理画面へ
        </Link>
      </div>
    </main>
  );
}
