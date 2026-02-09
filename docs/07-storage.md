# ストレージ設計（画像の扱い）

## パス設計

| 種別 | パス例 |
|------|--------|
| フレーム | `frames/{event_id}/{frame_id}.png` |
| 参加者アップロード画像 | `media/{event_id}/{media_asset_id}.jpg` |

## 方針

- 画像は**原本**と、必要なら**最終出力（合成済み）**を分けられる
- **MVP**：合成済みだけ保存でもOK（実装が簡単）
- 参照URLは **署名GET（期限付き）** を原則（漏洩リスク低減）

## アップロードフロー

1. クライアントが `POST /public/uploads` で `session_id`, `content_type` を送信
2. サーバがストレージの **署名PUT URL** を発行し、`media_assets` に1件 insert
3. クライアントはそのURLに **PUT** で直アップロード（API経由しない）
4. 参照時はサーバが **署名GET URL** を発行して返す

## 対応ストレージ

- S3互換（AWS S3 / Cloudflare R2 等）
- 署名URL（Presigned URL）の PUT/GET を利用
