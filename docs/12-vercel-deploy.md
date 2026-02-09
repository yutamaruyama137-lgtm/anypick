# Vercel デプロイ手順

## 1. 基本設定（このままでOK）

- **Import**: GitHub `yutamaruyama137-lgtm/anypick` / ブランチ `main` ✓
- **Project Name**: `anypick` ✓
- **Framework Preset**: Next.js ✓
- **Root Directory**: `./` ✓

## 2. デプロイ前に必ずやること：環境変数

**Environment Variables** を開いて、次の3つを追加してください。

| Name | Value | 備考 |
|------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | あなたの Supabase Project URL | 例: https://xxxxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon (public) key | Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase の service_role (secret) key | **秘密のため「Sensitive」にチェック推奨** |

（値は `.env.local` と同じでOKです。）

### 本番URLを参加者用にする場合（任意）

QRコードや参加者リンクを本番ドメインにしたいときは、以下も追加します。

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_APP_URL` | デプロイ後のURL（例: `https://anypick.vercel.app`） |

※ 未設定の場合は Vercel のデプロイURLが使われます。

## 3. Deploy をクリック

環境変数を保存したあと、**Deploy** でデプロイできます。  
初回はビルドに数分かかることがあります。

## 4. デプロイ後の確認

- トップページと `/admin/login` が開くか
- 管理画面でログイン → イベント作成 → QRタブでQR表示
- 参加者URL（`https://あなたのドメイン/e/{event_token}`）でスマホからアクセスできるか

問題があれば Vercel の **Deployments** → 該当デプロイ → **Building** や **Functions** のログでエラーを確認してください。
