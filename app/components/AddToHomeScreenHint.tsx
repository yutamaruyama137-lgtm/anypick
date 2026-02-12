"use client";

import { useState, useEffect } from "react";

/**
 * PWA：まだホーム画面に追加していない場合にだけ、案内を表示する。
 * standalone で開いている場合は非表示（追加済みとみなす）。
 */
export function AddToHomeScreenHint() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // すでにスタンドアロン（ホーム画面から起動）の場合は表示しない
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (!isStandalone) setShow(true);
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="w-full max-w-xs sm:max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm mb-1">
            ホーム画面に追加すると便利です
          </p>
          <p className="text-[var(--text-muted)] text-xs leading-relaxed">
            ［iPhone］Safariで「共有」→「ホーム画面に追加」／
            ［Android］Chromeで「︙」→「ホーム画面に追加」
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1.5 rounded-lg text-[var(--text-dim)] hover:text-white hover:bg-[var(--surface-elevated)] transition-smooth"
          aria-label="閉じる"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
