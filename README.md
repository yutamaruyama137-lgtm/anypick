# AnyPick（PWA）

イベント会場でQRから即カメラ起動→撮影→フレーム合成→応募確定までを実現するPWA。

## 推奨アーキテクチャ（最短で現場運用まで）

| レイヤー | 技術 |
|----------|------|
| **Frontend** | Next.js（PWA） `/e/{event_token}`（参加者） / `/admin`（主催者） |
| **Backend API** | Next.js API Routes または 別サーバ（REST前提） |
| **DB** | Postgres |
| **Auth（主催者）** | メールマジックリンク or パスワード（運用楽なのはマジックリンク） |
| **Storage** | S3互換（Cloudflare R2 / AWS S3）＋ **署名URL（PUT/GET）** |
| **画像合成** | MVPは **クライアント（Canvas）合成**でOK |

## ドキュメント一覧

| ドキュメント | 説明 |
|--------------|------|
| [docs/01-architecture.md](docs/01-architecture.md) | 推奨アーキテクチャ |
| [docs/02-screen-flows.md](docs/02-screen-flows.md) | 画面一覧・遷移図 |
| [docs/03-user-stories.md](docs/03-user-stories.md) | ユーザーストーリー（P0/P1/P2） |
| [docs/04-permissions.md](docs/04-permissions.md) | 権限設計（RBAC・マルチテナント） |
| [docs/05-api-spec.md](docs/05-api-spec.md) | API仕様（REST） |
| [db/01-schema.sql](db/01-schema.sql) | Postgres DDL |
| [db/02-analytics-queries.sql](db/02-analytics-queries.sql) | 集計用サンプルSQL |
| [docs/06-metrics.md](docs/06-metrics.md) | 計測定義（ダッシュボードKPI） |
| [docs/07-storage.md](docs/07-storage.md) | ストレージ方針 |
| [docs/08-one-submission.md](docs/08-one-submission.md) | 「1人1回」制限の実装方針 |
| [docs/09-components.md](docs/09-components.md) | 画面ごと必要コンポーネント |
| [docs/10-mvp-checklist.md](docs/10-mvp-checklist.md) | MVPチェックリスト |

## クイックスタート（開発者向け）

1. **手順書を読む**: [docs/11-runbook.md](docs/11-runbook.md) に「ここからの進め方」をすべて記載
2. **Supabase** でプロジェクト作成 → `db/01-schema.sql` を SQL Editor で実行 → Storage で `frames` / `media` バケット作成
3. `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` を設定
4. `npm install` → `npm run dev` で起動。主催者は `/admin` でマジックリンクログイン、参加者は `/e/{event_token}` で利用

---

必要に応じて **OpenAPI（Swagger）** と **集計SQL** を追加できます。
