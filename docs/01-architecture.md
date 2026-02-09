# 推奨アーキテクチャ

## 概要

- **Frontend**：Next.js（PWA）
  - 参加者：`/e/{event_token}`
  - 主催者：`/admin`
- **Backend API**：Next.js API Routes でも、別サーバでもOK（REST前提）
- **DB**：Postgres
- **Auth（主催者）**：メールマジックリンク or パスワード（運用楽なのはマジックリンク）
- **Storage**：S3互換（Cloudflare R2 / AWS S3）＋ **署名URL（PUT/GET）**
- **画像合成**：MVPは **クライアント（Canvas）合成**でOK  
  （品質担保の自動補正を強くするなら後でサーバ側処理を追加）

## ルーティング分離

- 参加者：`/e/{event_token}`（ログイン不要、event_tokenのみ）
- 主催者：`/admin/*`（ログイン必須）

## マルチテナント

- DBに `tenant_id` を持たせ、API側で必ず `tenant_id` を強制フィルタ
- フロントから `tenant_id` を渡させない（改ざん対策）
