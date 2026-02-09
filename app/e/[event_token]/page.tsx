"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { EventPublic, SessionStartResponse } from "@/lib/types";

type Step = "lp" | "camera" | "preview" | "confirm" | "share" | "done";

export default function EventPage() {
  const params = useParams();
  const event_token = params.event_token as string;
  const [step, setStep] = useState<Step>("lp");
  const [event, setEvent] = useState<EventPublic | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [agree, setAgree] = useState(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchEvent = useCallback(async () => {
    const res = await fetch(`/api/public/events/${event_token}`);
    if (!res.ok) {
      setError("イベントが見つかりません");
      return;
    }
    const data = await res.json();
    setEvent(data.event);
  }, [event_token]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    if (event && !event.consent_template?.text) setAgree(true);
  }, [event]);

  const startSession = useCallback(async (qrSource?: string) => {
    const res = await fetch("/api/public/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_token,
        qr_source_code: qrSource || undefined,
      }),
    });
    if (!res.ok) {
      setError("セッションを開始できません");
      return;
    }
    const data: SessionStartResponse = await res.json();
    setSessionId(data.session_id);
    if (data.already_submitted) {
      setAlreadySubmitted(true);
      setStep("done");
    }
  }, [event_token]);

  const handleAgree = useCallback(async () => {
    if (!agree) return;
    setError(null);
    await startSession();
    setStep("camera");
  }, [agree, startSession]);

  const sendMetric = useCallback(
    async (type: "camera_complete" | "save_click" | "outbound_click", platform?: string) => {
      if (!sessionId) return;
      await fetch("/api/public/metrics/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          events: [{ type, ts: new Date().toISOString(), platform }],
        }),
      });
    },
    [sessionId]
  );

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("カメラを起動できませんでした");
    }
  }, []);

  useEffect(() => {
    if (step === "camera") startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step, startCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPhotoBlob(blob);
          sendMetric("camera_complete");
          setStep("preview");
        }
      },
      "image/jpeg",
      0.9
    );
  }, [sendMetric]);

  const retake = useCallback(() => {
    setPhotoBlob(null);
    setStep("camera");
  }, []);

  const uploadAndSubmit = useCallback(async () => {
    if (!sessionId || !photoBlob || !event) return;
    setError(null);
    try {
      const form = new FormData();
      form.set("session_id", sessionId);
      form.set("file", photoBlob, "photo.jpg");
      const upRes = await fetch("/api/public/uploads", {
        method: "POST",
        body: form,
      });
      if (!upRes.ok) {
        const e = await upRes.json().catch(() => ({}));
        throw new Error(e.error || "アップロードに失敗しました");
      }
      const upData = await upRes.json();
      setMediaAssetId(upData.media_asset_id);

      const subRes = await fetch("/api/public/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          media_asset_id: upData.media_asset_id,
          consent: { agree_reuse: true },
        }),
      });
      if (!subRes.ok) {
        const e = await subRes.json().catch(() => ({}));
        throw new Error(e.error || "応募に失敗しました");
      }
      const caption =
        event.share_caption_template +
        "\n" +
        (event.share_hashtags?.join(" ") ?? "");
      setShareCaption(caption);
      setStep("share");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }, [sessionId, photoBlob, event]);

  const copyCaption = useCallback(async () => {
    await navigator.clipboard.writeText(shareCaption);
    if (sessionId) {
      await fetch("/api/public/metrics/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          events: [{ type: "save_click", ts: new Date().toISOString() }],
        }),
      });
    }
  }, [shareCaption, sessionId]);

  const openOutbound = useCallback(
    (platform: string) => {
      const url =
        platform === "instagram"
          ? "https://www.instagram.com/"
          : "https://x.com/";
      window.open(url, "_blank");
      if (sessionId) {
        fetch("/api/public/metrics/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            events: [
              { type: "outbound_click", platform, ts: new Date().toISOString() },
            ],
          }),
        });
      }
    },
    [sessionId]
  );

  if (!event && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="animate-pulse text-zinc-500">読み込み中…</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-950">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-zinc-700 px-4 py-2 text-sm"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!event) return null;

  return (
    <main className="min-h-screen bg-surface-950 text-zinc-100 safe-bottom">
      {step === "lp" && (
        <div className="max-w-md mx-auto p-6 flex flex-col min-h-screen justify-center">
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            {event.name}
          </h1>
          <p className="text-zinc-400 text-sm mb-6 whitespace-pre-wrap">
            {event.rules_text || "写真を撮って応募しよう！"}
          </p>
          {event.consent_template?.text && (
            <div className="rounded-xl bg-surface-850 border border-zinc-800 p-4 mb-6">
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">
                {event.consent_template.text}
              </p>
              <label className="mt-4 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="rounded border-zinc-600"
                />
                <span className="text-sm">上記に同意する</span>
              </label>
            </div>
          )}
          <button
            onClick={handleAgree}
            disabled={!agree}
            className="rounded-xl bg-brand-500 py-3 px-6 font-medium text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            同意して撮影を始める
          </button>
        </div>
      )}

      {step === "camera" && (
        <div className="flex flex-col h-dvh">
          <div className="flex-1 relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          {error && (
            <p className="text-red-400 text-center py-2 text-sm">{error}</p>
          )}
          <div className="p-4 safe-bottom bg-surface-900 flex justify-center">
            <button
              onClick={capture}
              className="w-16 h-16 rounded-full bg-white border-4 border-zinc-400"
              aria-label="撮影"
            />
          </div>
        </div>
      )}

      {step === "preview" && photoBlob && (
        <div className="max-w-md mx-auto p-6 flex flex-col min-h-screen">
          <p className="text-zinc-400 text-sm mb-4">プレビュー</p>
          <div className="rounded-2xl overflow-hidden bg-black aspect-[3/4] mb-6">
            <img
              src={URL.createObjectURL(photoBlob)}
              alt="プレビュー"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={retake}
              className="flex-1 rounded-xl border border-zinc-600 py-3"
            >
              撮り直す
            </button>
            <button
              onClick={uploadAndSubmit}
              className="flex-1 rounded-xl bg-brand-500 py-3 px-4 font-medium text-black"
            >
              この1枚で応募する
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
        </div>
      )}

      {step === "share" && (
        <div className="max-w-md mx-auto p-6 flex flex-col min-h-screen justify-center">
          <h2 className="font-display text-xl font-bold text-white mb-2">
            応募完了！
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            キャプションをコピーしてSNSでシェアしよう
          </p>
          <div className="rounded-xl bg-surface-850 border border-zinc-800 p-4 mb-4">
            <p className="text-zinc-300 text-sm whitespace-pre-wrap break-all">
              {shareCaption}
            </p>
          </div>
          <button
            onClick={copyCaption}
            className="rounded-xl bg-zinc-700 py-3 mb-3 w-full"
          >
            キャプションをコピー
          </button>
          <div className="flex gap-3">
            {event.share_targets?.includes("instagram") && (
              <button
                onClick={() => openOutbound("instagram")}
                className="flex-1 rounded-xl bg-pink-600/80 py-3"
              >
                Instagram
              </button>
            )}
            {(event.share_targets?.includes("x") || event.share_targets?.includes("twitter")) && (
              <button
                onClick={() => openOutbound("x")}
                className="flex-1 rounded-xl bg-zinc-800 py-3"
              >
                X
              </button>
            )}
          </div>
          <button
            onClick={() => setStep("done")}
            className="mt-8 text-zinc-500 text-sm"
          >
            閉じる
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="max-w-md mx-auto p-6 flex flex-col min-h-screen justify-center">
          <h2 className="font-display text-xl font-bold text-white mb-2">
            {alreadySubmitted ? "提出済みです" : "ありがとうございました"}
          </h2>
          <p className="text-zinc-400 text-sm">
            {alreadySubmitted
              ? "このイベントにはすでに応募済みです。"
              : "またのご参加をお待ちしています。"}
          </p>
        </div>
      )}
    </main>
  );
}
