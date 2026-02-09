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
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-zinc-500 text-sm hover:bg-zinc-800 hover:text-zinc-300 transition truncate max-w-[200px]"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="truncate">{displayEmail}</span>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-zinc-700 bg-surface-900 py-1 shadow-lg z-50">
          <Link
            href="/admin/account"
            className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            onClick={() => setOpen(false)}
          >
            登録情報
          </Link>
          <form action="/api/admin/auth/logout" method="post" className="block">
            <button
              type="submit"
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              ログアウト
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
