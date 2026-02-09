"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function AdminUserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const displayEmail = email.length > 24 ? `${email.slice(0, 24)}...` : email;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[var(--text-muted)] text-sm transition-smooth hover:bg-[var(--surface-elevated)] hover:text-white truncate max-w-[200px] focus-ring"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="truncate">{displayEmail}</span>
        <svg className="w-4 h-4 shrink-0 transition-transform duration-smooth" style={{ transform: open ? "rotate(180deg)" : undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl z-50 animate-scale-in origin-top-right">
          <Link
            href="/admin/account"
            className="block px-4 py-2.5 text-sm text-[var(--text-muted)] transition-smooth hover:bg-[var(--surface-elevated)] hover:text-white"
            onClick={() => setOpen(false)}
          >
            登録情報
          </Link>
          <form action="/api/admin/auth/logout" method="post" className="block">
            <button
              type="submit"
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-muted)] transition-smooth hover:bg-[var(--surface-elevated)] hover:text-white"
            >
              ログアウト
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
