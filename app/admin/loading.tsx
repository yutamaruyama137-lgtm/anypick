import { LoadingSpinner } from "../components/LoadingSpinner";

export default function AdminLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)]">
      <LoadingSpinner subtitle="読み込み中…" />
    </div>
  );
}
