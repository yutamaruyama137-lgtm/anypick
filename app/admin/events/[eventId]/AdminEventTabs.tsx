"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type Tab = "analytics" | "frames" | "qr" | "submissions" | "settings";

const tabs: { id: Tab; label: string }[] = [
  { id: "analytics", label: "分析" },
  { id: "frames", label: "フレーム" },
  { id: "qr", label: "QR" },
  { id: "submissions", label: "応募一覧" },
  { id: "settings", label: "設定" },
];

interface EventRow {
  id: string;
  name: string;
  event_token: string;
  rules_text?: string;
  share_caption_template?: string;
  share_hashtags?: string[];
  share_targets?: string[];
  status?: string;
  [key: string]: unknown;
}

export function AdminEventTabs({
  eventId,
  event,
  participantUrl,
}: {
  eventId: string;
  event: EventRow;
  participantUrl: string;
}) {
  const [active, setActive] = useState<Tab>("analytics");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    summary: {
      scan: number;
      camera_complete: number;
      save_click: number;
      outbound_click: Record<string, number>;
      submit_complete: number;
      consent_agree_rate: number;
    };
  } | null>(null);
  const [frames, setFrames] = useState<{ id: string; image_url: string | null; is_active: boolean }[]>([]);
  const [qrSources, setQrSources] = useState<{ id: string; code: string; label: string | null }[]>([]);
  const [submissions, setSubmissions] = useState<
    { id: string; consent_agree_reuse: boolean; image_url: string | null; created_at: string }[]
  >([]);

  const refetch = () => {
    if (active === "frames") {
      fetch(`/api/admin/events/${eventId}/frames`)
        .then((r) => r.json())
        .then((d) => setFrames(d.frames ?? []))
        .catch(() => setFrames([]));
    } else if (active === "qr") {
      fetch(`/api/admin/events/${eventId}/qr-sources`)
        .then((r) => r.json())
        .then((d) => setQrSources(d.qr_sources ?? []))
        .catch(() => setQrSources([]));
    }
  };

  useEffect(() => {
    if (active === "analytics") {
      fetch(`/api/admin/events/${eventId}/analytics`)
        .then((r) => r.json())
        .then((d) => setAnalytics(d))
        .catch(() => setAnalytics(null));
    } else if (active === "frames") {
      fetch(`/api/admin/events/${eventId}/frames`)
        .then((r) => r.json())
        .then((d) => setFrames(d.frames ?? []))
        .catch(() => setFrames([]));
    } else if (active === "qr") {
      fetch(`/api/admin/events/${eventId}/qr-sources`)
        .then((r) => r.json())
        .then((d) => setQrSources(d.qr_sources ?? []))
        .catch(() => setQrSources([]));
    } else if (active === "submissions") {
      fetch(`/api/admin/events/${eventId}/submissions`)
        .then((r) => r.json())
        .then((d) => setSubmissions(d.submissions ?? []))
        .catch(() => setSubmissions([]));
    }
  }, [active, eventId]);

  useEffect(() => {
    if (active === "qr" && participantUrl) {
      QRCode.toDataURL(participantUrl, { width: 280, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [active, participantUrl]);

  return (
    <div>
      <div className="flex gap-2 border-b border-zinc-800 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              active === t.id
                ? "border-brand-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "analytics" && (
        <div className="rounded-2xl border border-zinc-800 bg-surface-900/50 p-6">
          {analytics?.summary ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Scan" value={analytics.summary.scan} />
              <StatCard label="撮影完了" value={analytics.summary.camera_complete} />
              <StatCard label="保存" value={analytics.summary.save_click} />
              <StatCard label="応募完了" value={analytics.summary.submit_complete} />
              <div className="col-span-2 sm:col-span-1 rounded-xl bg-surface-850 p-4">
                <p className="text-zinc-500 text-sm">同意率</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {(analytics.summary.consent_agree_rate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="col-span-2 rounded-xl bg-surface-850 p-4">
                <p className="text-zinc-500 text-sm">外部遷移</p>
                <p className="text-lg font-medium text-white mt-1">
                  instagram: {analytics.summary.outbound_click?.instagram ?? 0} / x:{" "}
                  {analytics.summary.outbound_click?.x ?? 0}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500">読み込み中…</p>
          )}
        </div>
      )}

      {active === "frames" && (
        <div className="rounded-2xl border border-zinc-800 bg-surface-900/50 p-6">
          <FrameUpload eventId={eventId} onUploaded={refetch} />
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {frames.length === 0 && !analytics ? (
              <p className="text-zinc-500 col-span-full">読み込み中…</p>
            ) : frames.length === 0 ? (
              <p className="text-zinc-500 col-span-full">フレームがありません。アップロードしてください。</p>
            ) : (
              frames.map((f) => (
                <div key={f.id} className="rounded-xl border border-zinc-800 overflow-hidden">
                  {f.image_url ? (
                    <img src={f.image_url} alt="" className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-surface-850 flex items-center justify-center text-zinc-500">
                      No image
                    </div>
                  )}
                  <p className="p-2 text-xs text-zinc-500">{f.is_active ? "表示中" : "非表示"}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {active === "qr" && (
        <div className="rounded-2xl border border-zinc-800 bg-surface-900/50 p-6">
          {/* 参加者用QRコード（読み取るとイベント参加・写真投稿へ） */}
          <div className="mb-8 p-6 rounded-xl bg-white inline-block">
            <p className="text-zinc-800 text-sm font-medium mb-3">参加者用QRコード</p>
            <p className="text-zinc-600 text-xs mb-4 max-w-xs">読み取るとこのイベントの参加ページが開き、写真の撮影・応募ができます</p>
            {qrDataUrl ? (
              <div className="flex flex-col items-start gap-4">
                <img
                  src={qrDataUrl}
                  alt="参加者用QRコード（読み取ってイベントに参加）"
                  width={280}
                  height={280}
                  className="rounded-lg"
                />
                <a
                  href={qrDataUrl}
                  download={`anypick-${event.name.replace(/\s/g, "-")}-qr.png`}
                  className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700"
                >
                  QRコードをダウンロード
                </a>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">生成中…</p>
            )}
          </div>

          <p className="text-zinc-500 text-sm mb-3">入口別QR（集計用・任意）</p>
          <QrCreate eventId={eventId} onCreated={refetch} />
          <ul className="mt-6 space-y-3">
            {qrSources.length === 0 && active === "qr" ? (
              <li className="text-zinc-500">QRソースがありません。追加すると入口別集計ができます。</li>
            ) : (
              qrSources.map((q) => (
                <li key={q.id} className="flex items-center justify-between rounded-xl border border-zinc-800 p-3">
                  <span className="font-mono text-sm">{q.code}</span>
                  {q.label && <span className="text-zinc-500 text-sm">{q.label}</span>}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {active === "submissions" && (
        <div className="rounded-2xl border border-zinc-800 bg-surface-900/50 p-6">
          <div className="flex gap-2 mb-4">
            <Link
              href={`/admin/events/${eventId}/submissions?consent=agree_reuse`}
              className="rounded-lg border border-zinc-600 px-3 py-1 text-sm"
            >
              同意ありのみ
            </Link>
          </div>
          {submissions.length === 0 && active === "submissions" ? (
            <p className="text-zinc-500">応募がありません。</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {submissions.map((s) => (
                <div key={s.id} className="rounded-xl border border-zinc-800 overflow-hidden">
                  {s.image_url ? (
                    <a href={s.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={s.image_url} alt="" className="w-full aspect-square object-cover" />
                    </a>
                  ) : (
                    <div className="w-full aspect-square bg-surface-850" />
                  )}
                  <p className="p-2 text-xs text-zinc-500">
                    {s.consent_agree_reuse ? "同意あり" : "同意なし"} ·{" "}
                    {new Date(s.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {active === "settings" && (
        <div className="rounded-2xl border border-zinc-800 bg-surface-900/50 p-6 max-w-xl">
          <p className="text-zinc-500 text-sm mb-2">イベント名</p>
          <p className="text-white font-medium">{event.name}</p>
          <p className="text-zinc-500 text-sm mt-4">ステータス</p>
          <p className="text-white">{event.status ?? "active"}</p>
          <p className="text-zinc-500 text-sm mt-4">ルール文言</p>
          <p className="text-zinc-300 text-sm whitespace-pre-wrap mt-1">
            {event.rules_text || "（未設定）"}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-850 p-4">
      <p className="text-zinc-500 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function FrameUpload({ eventId, onUploaded }: { eventId: string; onUploaded: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setErr(null);
    const form = new FormData();
    form.set("file", file);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/frames`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "アップロード失敗");
      }
      onUploaded();
      (e.target as HTMLInputElement).value = "";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="inline-block rounded-xl border border-zinc-600 px-4 py-2 text-sm cursor-pointer hover:bg-surface-850">
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={loading} />
        {loading ? "アップロード中…" : "フレームをアップロード"}
      </label>
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
    </div>
  );
}

function QrCreate({ eventId, onCreated }: { eventId: string; onCreated: () => void }) {
  const [code, setCode] = useState("gateA");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/qr-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() || "default" }),
      });
      if (!res.ok) throw new Error("Failed");
      setCode("gateA");
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="code (例: gateA)"
        className="rounded-lg border border-zinc-700 bg-surface-900 px-3 py-2 text-sm w-32"
      />
      <button
        onClick={create}
        disabled={loading}
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        追加
      </button>
    </div>
  );
}
