/**
 * アプリの公開URL（参加者URL・QRコードのベース）
 * - NEXT_PUBLIC_APP_URL が設定されていればそれを使用
 * - Vercel デプロイ時は VERCEL_URL から自動で https のURLを生成
 * - それ以外は localhost
 */
export function getAppOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
