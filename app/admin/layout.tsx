import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen bg-surface-950 text-zinc-100">
      {user ? (
        <header className="border-b border-zinc-800/80 sticky top-0 z-10 bg-surface-950/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/admin" className="font-display font-bold text-lg">
              AnyPick Admin
            </Link>
            <span className="text-zinc-500 text-sm truncate max-w-[180px]">
              {user.email}
            </span>
          </div>
        </header>
      ) : null}
      {children}
    </div>
  );
}
