# AnyPick 開発・運用 手順書

ここからの進め方とやり方をまとめた手順書です。**できるところは実行済み**です。手動で行う項目だけ残してあります。

---

## 1. 前提

- **DB**: Supabase（Postgres + Auth + Storage）
- **Frontend**: Next.js（App Router）PWA
- **認証（主催者）**: Supabase Auth のメール＋パスワード（ログイン / 新規登録）

---

## 2. 初回セットアップ（手順）

### 2-1. Supabase プロジェクト作成（手動）

1. [Supabase](https://supabase.com) にログイン
2. **New project** でプロジェクト作成（リージョン・パスワードを設定）
3. 作成後、**Project Settings** → **API** で以下を控える:
   - `Project URL`
   - `anon` (public) key
   - `service_role` key（サーバー用・厳重に管理）

### 2-2. DB スキーマ投入（手動）

1. Supabase ダッシュボード → **SQL Editor**
2. リポジトリの **`db/01-schema.sql`** の内容をコピーして実行
3. （Supabase では `auth.users` と連携するため、後述の「初回管理者作成」で `admin_users` にレコードを入れる）

### 2-3. Storage バケット作成（手動）

1. Supabase ダッシュボード → **Storage** → **New bucket**
2. バケットを **2つ** 作成（**Public bucket はオフ**のまま）:
   - 名前: `frames` … フレーム画像用
   - 名前: `media` … 参加者アップロード画像用
3. いずれも **Private** のまま。アップロード・署名URLは **service_role** で行うため、追加ポリシーがなくても動作する。

### 2-4. Authentication（メール＋パスワードを有効にする）

主催者ログインでパスワードを設定・利用するために、Supabase で以下を確認してください。

1. ダッシュボード → **Authentication** → **Providers** → **Email**
2. **Enable Email provider** をオンにする
3. **Confirm email** は開発時はオフ（オンの場合は新規登録後に確認メールのリンクをクリックする必要あり）
4. これで「メール＋パスワード」での signUp / signIn が利用可能になります（マジックリンクは使っていません）

### 2-5. 環境変数（手動）

プロジェクトルートに **`.env.local`** を作成:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

- 参加者向け API とクライアント: `NEXT_PUBLIC_*` と `anon`
- 管理 API（主催者・署名URL発行など）: `service_role` をサーバーだけで使用

### 2-6. 依存関係インストール・起動（手動）

```bash
cd c:\Users\youta\Downloads\AnyPick
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

### 2-7. ビルド確認（任意）

```bash
npm run build
```

成功すれば「実行済み」の実装はそのまま利用できる状態。

---

## 3. 開発の進め方（優先順）

1. **参加者フロー**  
   `/e/[event_token]` でイベント取得 → 同意 → セッション開始 → カメラ → 合成 → アップロード → 応募 → 保存/シェア
2. **管理画面**  
   `/admin` ログイン（マジックリンク）→ イベント一覧 → 作成 → フレーム・QR → ダッシュボード・応募一覧
3. **計測**  
   `metrics_events` への insert と、ダッシュボード用の集計 API

実装の抜け漏れ防止は **`docs/09-components.md`** と **`docs/10-mvp-checklist.md`** を参照。

---

## 4. 主催者認証（Supabase Auth）の流れ

- **ログイン**: メール＋パスワード入力 → `signInWithPassword({ email, password })` → セッションをクッキーに保存 → `/admin` へ
- **新規登録**: メール＋パスワード（8文字以上）入力 → `signUp({ email, password })` → 同一リクエスト内で `tenants` と `admin_users` を自動作成（サーバー側で `service_role` 使用）→ そのままログイン状態で `/admin` へ（Confirm email オフの場合）

---

## 5. 実行済み・実装済みの内容

- 手順書（本ドキュメント）
- Next.js（App Router）＋ PWA 設定
- Supabase クライアント設定（`.env.local` は手動）
- `db/01-schema.sql` … Supabase の SQL Editor で実行する想定
- 参加者用ページ: `/e/[event_token]`（LP・同意・カメラ・プレビュー・応募・完了の流れ）
- 管理用ページ: `/admin`（ログイン・イベント一覧・作成・編集・フレーム・QR・ダッシュボード・応募一覧）
- Public API: イベント取得・セッション開始・アップロードURL取得・応募・計測バッチ
- Admin API: 認証・イベント CRUD・フレーム・QR・応募一覧・集計・エクスポート
- Storage: Supabase Storage の署名 URL（PUT/GET）でフレーム・メディアを保存
- UI: スタイリッシュで大まかな見た目まで実装（細部は未調整可）

---

## 6. 手動でやること一覧

| 項目 | 内容 |
|------|------|
| Supabase プロジェクト | 作成し、URL とキーを取得 |
| スキーマ投入 | `db/01-schema.sql` を SQL Editor で実行 |
| Storage バケット | `frames` と `media` を作成 |
| `.env.local` | 上記の 3 変数を設定 |
| `npm install` & `npm run dev` | ローカル起動・動作確認 |
| 初回管理者 | 管理画面で「新規登録」からメール＋パスワードで登録すると、テナント＋管理者が自動作成される |

---

## 7. よく使うコマンド

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド
npm run start    # 本番起動
npm run lint     # Lint
```

---

## 8. トラブルシュート

- **DB エラー**: Supabase の **Table Editor** でテーブルができているか確認。外部キーで参照しているため、`tenants` → `admin_users` → `events` の順で作成される。
- **署名 URL が 403**: Storage のポリシーと、`service_role` で署名しているか確認。
- **パスワードでログインできない**: Supabase の **Authentication** → **Providers** → **Email** で「Enable Email provider」がオンか確認。**Confirm email** をオフにすると、新規登録後すぐログインできる。

以上で、開発に着手できる状態まで揃えています。

---

## 9. GitHub へのアップロード

リポジトリは **すでにコミット済み**（ブランチ `main`）です。次だけ実行してください。

1. **GitHub で新規リポジトリを作成**
   - https://github.com/new を開く
   - リポジトリ名（例: `AnyPick`）を入力
   - **Add a README file** は付けない（既にローカルにあるため）
   - Create repository をクリック

2. **リモートを追加してプッシュ**（GitHub に表示されたコマンドの通り、または以下）

```bash
cd c:\Users\youta\Downloads\AnyPick
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
git push -u origin main
```

- SSH を使う場合: `git remote add origin git@github.com:あなたのユーザー名/リポジトリ名.git`
- 認証を求められたら GitHub のユーザー名とパスワード（または Personal Access Token）を入力
   