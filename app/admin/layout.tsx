import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AdminUserMenu } from "./AdminUserMenu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen bg-[var(--bg)] text-white">
      {user ? (
        <header className="border-b border-[var(--border)] sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur-md transition-smooth">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              href="/admin"
              className="font-display font-bold text-lg transition-smooth hover:opacity-80 focus-ring rounded-lg px-2 py-1 -mx-2 -my-1"
            >
              AnyPick Admin
            </Link>
            <AdminUserMenu email={user.email ?? ""} />
          </div>
        </header>
      ) : null}
      {children}
    </div>
  );
}
