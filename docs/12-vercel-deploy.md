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

### 参加者URL・QRコードのベースURL

参加者URL（イベント詳細の「参加者URL」やQRコード）は次の優先順で決まります。

1. **NEXT_PUBLIC_APP_URL** を設定している場合 → その値
2. 未設定でも **Vercel デプロイ時** → `VERCEL_URL` から自動で `https://あなたのプロジェクト.vercel.app` を使用
3. 上記以外（ローカル） → `http://localhost:3000`

カスタムドメインを使う場合は、**NEXT_PUBLIC_APP_URL** にそのURL（例: `https://anypick.example.com`）を設定してください。

## 3. Deploy をクリック

環境変数を保存したあと、**Deploy** でデプロイできます。  
初回はビルドに数分かかることがあります。

## 4. デプロイ後の確認

- トップページと `/admin/login` が開くか
- 管理画面でログイン → イベント作成 → QRタブでQR表示
- 参加者URL（`https://あなたのドメイン/e/{event_token}`）でスマホからアクセスできるか

問題があれば Vercel の **Deployments** → 該当デプロイ → **Building** や **Functions** のログでエラーを確認してください。
