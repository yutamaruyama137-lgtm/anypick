"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { EventPublic, SessionStartResponse } from "@/lib/types";

type Step = "lp" | "camera" | "preview" | "confirm" | "share" | "done";

const AUTO_KEEP_SEC = 30;

export default function EventPage() {
  const params = useParams();
  const event_token = params.event_token as string;
  const [step, setStep] = useState<Step>("lp");
  const [event, setEvent] = useState<EventPublic | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [agree, setAgree] = useState(false);
  const [agreeSubmit, setAgreeSubmit] = useState(false);
  const [intentToStartCamera, setIntentToStartCamera] = useState(false);
  const sessionStartedForAgreeRef = useRef(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(AUTO_KEEP_SEC);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoKeepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // 同意チェックが入った時点でセッションを事前開始し、ボタン1タップで即カメラへ
  useEffect(() => {
    if (!agree || !event || sessionStartedForAgreeRef.current) return;
    sessionStartedForAgreeRef.current = true;
    startSession();
  }, [agree, event, startSession]);

  // ボタン押下後にセッション準備ができた場合、即カメラへ
  useEffect(() => {
    if (sessionId && intentToStartCamera) {
      setIntentToStartCamera(false);
      setStep("camera");
    }
  }, [sessionId, intentToStartCamera]);

  const handleAgree = useCallback(() => {
    if (!agree) return;
    setError(null);
    if (sessionId) {
      setStep("camera");
    } else {
      setIntentToStartCamera(true);
    }
  }, [agree, sessionId]);

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

  const maxCaptures = event?.submission_policy?.max_captures ?? 3;

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
          setCaptureCount((c) => c + 1);
          sendMetric("camera_complete");
          setStep("preview");
        }
      },
      "image/jpeg",
      0.9
    );
  }, [sendMetric, event?.submission_policy?.max_captures]);

  const retake = useCallback(() => {
    setPhotoBlob(null);
    setStep("camera");
  }, []);

  const goToConfirm = useCallback(() => {
    if (autoKeepTimerRef.current) {
      clearTimeout(autoKeepTimerRef.current);
      autoKeepTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setStep("confirm");
  }, []);

  useEffect(() => {
    if (step !== "preview" || !photoBlob) return;
    setCountdown(AUTO_KEEP_SEC);
    const tick = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    countdownIntervalRef.current = tick;
    autoKeepTimerRef.current = setTimeout(() => {
      autoKeepTimerRef.current = null;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setStep("confirm");
    }, AUTO_KEEP_SEC * 1000);
    return () => {
      if (autoKeepTimerRef.current) clearTimeout(autoKeepTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      autoKeepTimerRef.current = null;
      countdownIntervalRef.current = null;
    };
  }, [step, photoBlob]);

  const uploadAndSubmit = useCallback(async () => {
    if (!sessionId || !photoBlob || !event) return;
    if (event.consent_template?.text && !agreeSubmit) return;
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
  }, [sessionId, photoBlob, event, agreeSubmit]);

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-pulse text-[var(--text-muted)] text-sm">読み込み中…</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)] animate-fade-in">
        <p className="text-red-400 mb-4 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-2xl border border-[var(--border-light)] px-4 py-2.5 text-sm font-medium transition-smooth hover:bg-[var(--surface-elevated)] active:scale-[0.98]"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!event) return null;

  const showStickyHeader = step !== "lp";

  // プレビュー/確認で1枚だけオブジェクトURLを生成し、ステップ離脱時にrevokeしてメモリリーク防止
  const photoObjectUrl = useMemo(
    () => (photoBlob ? URL.createObjectURL(photoBlob) : null),
    [photoBlob]
  );
  useEffect(() => {
    return () => {
      if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl);
    };
  }, [photoObjectUrl]);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white safe-bottom">
      {showStickyHeader && (
        <header className="sticky top-0 z-20 flex items-center gap-2 h-12 px-4 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] transition-smooth">
          <span className="text-lg" aria-hidden>📷</span>
          <span className="font-medium text-white truncate">撮影</span>
          {event.name && (
            <span className="text-[var(--text-muted)] text-sm truncate flex-1 min-w-0" title={event.name}>
              {event.name}
            </span>
          )}
        </header>
      )}

      {step === "lp" && (
        <div key="lp" className="max-w-md mx-auto p-6 flex flex-col min-h-screen justify-center animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            {event.name}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mb-6 whitespace-pre-wrap">
            {event.rules_text || "写真を撮って応募しよう！"}
          </p>
          {event.consent_template?.text && (
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 mb-6">
              <p className="text-[var(--text-muted)] text-sm whitespace-pre-wrap">
                {event.consent_template.text}
              </p>
              <label className="mt-4 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="rounded border-[var(--border-light)] bg-[var(--surface-elevated)]"
                />
                <span className="text-sm">上記に同意する</span>
              </label>
            </div>
          )}
          <button
            onClick={handleAgree}
            disabled={!agree || (intentToStartCamera && !sessionId)}
            className="rounded-2xl bg-white py-3.5 px-6 font-semibold text-black transition-smooth hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {intentToStartCamera && !sessionId ? (
              <>
                <svg className="w-5 h-5 animate-spin flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
                準備中…
              </>
            ) : (
              "同意して撮影を始める"
            )}
          </button>
        </div>
      )}

      {step === "camera" && (
        <div key="camera" className="flex flex-col h-dvh animate-fade-in">
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
          <div className="p-4 safe-bottom bg-[var(--bg)] flex justify-center">
            <button
              onClick={capture}
              className="w-16 h-16 rounded-full bg-white border-4 border-white/30 shadow-[0_0_0_2px_rgba(0,0,0,0.2)] transition-smooth hover:scale-105 active:scale-95"
              aria-label="撮影"
            />
          </div>
        </div>
      )}

      {step === "preview" && photoBlob && (
        <div key="preview" className="max-w-md mx-auto p-6 flex flex-col min-h-screen animate-fade-in-up">
          <p className="text-[var(--text-muted)] text-sm mb-2">プレビュー（{captureCount}/{maxCaptures}回目）</p>
          {countdown > 0 && (
            <p className="text-[var(--text-dim)] text-xs mb-2">あと {countdown} 秒で自動でKEEPします</p>
          )}
          <div className="rounded-2xl overflow-hidden bg-black aspect-[3/4] mb-6">
            {photoObjectUrl && (
              <img
                src={photoObjectUrl}
                alt="プレビュー"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex gap-3">
            {captureCount < maxCaptures ? (
              <button
                onClick={retake}
                className="flex-1 rounded-2xl border border-[var(--border-light)] py-3 font-medium transition-smooth hover:bg-[var(--surface-elevated)] active:scale-[0.98]"
              >
                撮り直す
              </button>
            ) : (
              <div className="flex-1" />
            )}
            <button
              onClick={goToConfirm}
              className="flex-1 rounded-2xl bg-white py-3 px-4 font-semibold text-black transition-smooth hover:bg-zinc-200 active:scale-[0.98]"
            >
              KEEP（応募確定へ）
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
        </div>
      )}

      {step === "confirm" && photoBlob && (
        <div key="confirm" className="max-w-md mx-auto p-6 flex flex-col min-h-screen animate-fade-in-up">
          <h2 className="font-display text-xl font-bold text-white mb-2">応募確定</h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">この写真で応募します。提出後は変更できません。</p>
          <div className="rounded-2xl overflow-hidden bg-black aspect-[3/4] mb-6">
            {photoObjectUrl && (
              <img
                src={photoObjectUrl}
                alt="応募写真"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {event.consent_template?.text && (
            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeSubmit}
                onChange={(e) => setAgreeSubmit(e.target.checked)}
                className="rounded border-[var(--border-light)] bg-[var(--surface-elevated)] mt-1"
              />
              <span className="text-[var(--text-muted)] text-sm">二次利用等の同意に同意する</span>
            </label>
          )}
          <button
            onClick={() => uploadAndSubmit()}
            disabled={event.consent_template?.text ? !agreeSubmit : false}
            className="rounded-2xl bg-white py-3.5 px-4 font-semibold text-black transition-smooth hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            提出する
          </button>
          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
        </div>
      )}

      {step === "share" && (
        <div key="share" className="max-w-md mx-auto p-6 flex flex-col min-h-screen justify-center animate-fade-in-up">
          <h2 className="font-display text-xl font-bold text-white mb-2">
            応募完了！
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            キャプションをコピーしてSNSでシェアしよう
          </p>
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 mb-4">
            <p className="text-[var(--text-muted)] text-sm whitespace-pre-wrap break-all">
              {shareCaption}
            </p>
          </div>
          <button
            onClick={copyCaption}
            className="rounded-2xl bg-[var(--surface-elevated)] py-3 mb-3 w-full font-medium transition-smooth hover:bg-[var(--surface)] active:scale-[0.98] border border-[var(--border)]"
          >
            キャプションをコピー
          </button>
          <div className="flex gap-3">
            {event.share_targets?.includes("instagram") && (
              <button
                onClick={() => openOutbound("instagram")}
                className="flex-1 rounded-2xl bg-pink-600/90 py-3 font-medium transition-smooth hover:bg-pink-600 active:scale-[0.98]"
              >
                Instagram
              </button>
            )}
            {(event.share_targets?.includes("x") || event.share_targets?.includes("twitter")) && (
              <button
                onClick={() => openOutbound("x")}
                className="flex-1 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-light)] py-3 font-medium transition-smooth hover:bg-[var(--surface)] active:scale-[0.98]"
              >
                X
              </button>
            )}
          </div>
          <button
            onClick={() => setStep("done")}
            className="mt-8 text-[var(--text-muted)] text-sm transition-smooth hover:text-white"
          >
            閉じる
          </button>
        </div>
      )}

      {step === "done" && (
        <div key="done" className="max-w-md mx-auto p-6 flex flex-col min-h-screen justify-center animate-fade-in-up">
          <h2 className="font-display text-xl font-bold text-white mb-2">
            {alreadySubmitted ? "提出済みです" : "ありがとうございました"}
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            {alreadySubmitted
              ? "このイベントにはすでに応募済みです。"
              : "またのご参加をお待ちしています。"}
          </p>
        </div>
      )}
    </main>
  );
}
