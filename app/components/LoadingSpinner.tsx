"use client";

/**
 * 止まって見えないローディング表示。
 * 外側のリング・内側のリング・下の3点が常に動き、無機質にならないようにする。
 */
export function LoadingSpinner({
  title,
  subtitle,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 animate-loading-glow ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative w-14 h-14 flex items-center justify-center">
        {/* 外側リング：時計回り */}
        <svg
          className="absolute w-14 h-14 animate-spin text-white/90"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="42"
            strokeDashoffset="14"
          />
        </svg>
        {/* 内側リング：反時計回り・遅め */}
        <svg
          className="absolute w-10 h-10 text-white/50 animate-spin-reverse"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="28"
            strokeDashoffset="10"
          />
        </svg>
      </div>

      {/* 3点が順番にふくらむ波 */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full bg-white/90 animate-loading-dot"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-white/90 animate-loading-dot"
          style={{ animationDelay: "160ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-white/90 animate-loading-dot"
          style={{ animationDelay: "320ms" }}
        />
      </div>

      {(title || subtitle) && (
        <div className="flex flex-col items-center gap-0.5 text-center">
          {title && <p className="text-white font-medium text-sm">{title}</p>}
          {subtitle && (
            <p className="text-[var(--text-muted)] text-xs">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
