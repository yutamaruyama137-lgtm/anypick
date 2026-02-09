"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewEventPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        // 未ログイン or 権限なし → ログインへ。戻り先を新規作成ページに
        window.location.href = `/admin/login?next=${encodeURIComponent("/admin/events/new")}`;
        return;
      }
      if (!res.ok) throw new Error(data.error || "作成に失敗しました");
      // いったんダッシュボードへ（作成完了メッセージ＋イベントを開くリンク）。直接イベントURLだとDB反映遅延で404になる場合があるため
      window.location.href = `/admin?created=${encodeURIComponent(data.event.id)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラー");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto p-6">
      <p className="text-zinc-500 text-sm mb-2">
        <Link href="/admin" className="hover:text-zinc-400">← イベント一覧</Link>
      </p>
      <h1 className="font-display text-2xl font-bold text-white mb-2">
        新規イベント作成
      </h1>
      <p className="text-zinc-500 text-sm mb-6">
        未ログインの場合は作成時にログイン画面へ移動し、ログイン後はこのページに戻ります。
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm text-zinc-400">イベント名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: AnyPick Night"
          required
          className="w-full rounded-xl border border-zinc-700 bg-surface-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-zinc-600 px-4 py-2"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-500 px-6 py-2 font-medium text-black disabled:opacity-50"
          >
            {loading ? "作成中…" : "作成"}
          </button>
        </div>
      </form>
    </main>
  );
}
