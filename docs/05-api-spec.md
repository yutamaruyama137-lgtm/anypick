# API 仕様（REST）

※最小で開発できる形。認証は Bearer または Cookie 想定（Admin のみ）。

---

## 4-1. Public（参加者）API

### ① イベント取得

**GET** `/public/events/{event_token}`

**Response**

```json
{
  "event": {
    "id": "uuid",
    "name": "AnyPick Night",
    "starts_at": "2026-02-10T10:00:00+09:00",
    "ends_at": "2026-02-10T18:00:00+09:00",
    "rules_text": "提出は1人1回まで…",
    "share_caption_template": "今日は最高… #AnyPick #Tokyo ...",
    "share_hashtags": ["#AnyPick", "#Tokyo", "#TGH"],
    "share_targets": ["instagram", "x"],
    "frame_active": {
      "id": "uuid",
      "image_url": "https://...signed..."
    },
    "consent_template": {
      "id": "uuid",
      "version": 3,
      "text": "主催者が広告等に二次利用することに同意…"
    },
    "submission_policy": {
      "max_submissions_per_person": 1,
      "allow_retake_count": 3,
      "require_ticket_code": false
    }
  }
}
```

---

### ② セッション開始（scan計測含む）

**POST** `/public/sessions`

**Body**

```json
{ "event_token": "abcd1234", "qr_source_code": "gateA" }
```

**Response**

```json
{ "session_id": "uuid", "already_submitted": false }
```

---

### ③ 署名アップロードURL取得（画像保存）

**POST** `/public/uploads`

**Body**

```json
{ "session_id": "uuid", "content_type": "image/jpeg" }
```

**Response**

```json
{
  "media_asset_id": "uuid",
  "upload_url": "https://storage...signed_put...",
  "public_read_url": "https://storage...signed_get..."
}
```

> フロントは `upload_url` に **PUT** で画像をアップロード（APIを通さず直でストレージへ）

---

### ④ 応募（提出）

**POST** `/public/submissions`

**Body**

```json
{
  "session_id": "uuid",
  "media_asset_id": "uuid",
  "consent": { "agree_reuse": true },
  "contact": { "email": "user@example.com" },
  "client_meta": { "device": "iPhone", "ua": "..." }
}
```

**Response**

```json
{ "submission_id": "uuid", "locked": true }
```

---

### ⑤ 計測イベント送信（save/outbound等）

**POST** `/public/metrics/batch`

**Body**

```json
{
  "session_id": "uuid",
  "events": [
    { "type": "save_click", "ts": "2026-02-09T10:00:00+09:00" },
    { "type": "outbound_click", "platform": "instagram", "ts": "..." }
  ]
}
```

**Response**

```json
{ "ok": true }
```

---

### ⑥ ワンタイムQR（チケットコード）消費（P1）

**POST** `/public/tickets/claim`

**Body**

```json
{ "event_token": "abcd1234", "ticket_code": "9K3F-2QAA" }
```

**Response**

```json
{ "valid": true, "ticket_id": "uuid" }
```

---

## 4-2. Admin（主催者）API

### Auth

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/admin/auth/login` | マジックリンク発行 |
| POST | `/admin/auth/verify` | トークン検証 |
| POST | `/admin/auth/logout` | ログアウト |
| GET | `/admin/me` | 自分情報 |

### イベント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/admin/events` | 一覧 |
| POST | `/admin/events` | 作成 |
| GET | `/admin/events/{event_id}` | 1件取得 |
| PATCH | `/admin/events/{event_id}` | 更新 |
| DELETE | `/admin/events/{event_id}` | 論理削除推奨 |

### フレーム

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/admin/events/{event_id}/frames` | アップロードURL発行 |
| GET | `/admin/events/{event_id}/frames` | 一覧 |
| PATCH | `/admin/frames/{frame_id}` | active切替 |
| DELETE | `/admin/frames/{frame_id}` | 削除 |

### QR

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/admin/events/{event_id}/qr-sources` | 入口別作成 |
| GET | `/admin/events/{event_id}/qr-sources` | 一覧 |
| GET | `/admin/events/{event_id}/qr-sources/{id}/qrcode` | PNG/PDF生成 |

### ワンタイムQR（P1）

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/admin/events/{event_id}/ticket-codes/generate` | 枚数生成 |
| GET | `/admin/events/{event_id}/ticket-codes/export` | CSV/PDF |

### 応募・DL

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/admin/events/{event_id}/submissions?consent=agree_reuse` | 一覧（同意フィルタ） |
| PATCH | `/admin/submissions/{submission_id}` | タグ付け/メモ |
| GET | `/admin/submissions/{submission_id}/download` | 署名DL URL |

### 分析

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/admin/events/{event_id}/analytics?from=...&to=...&group_by=hour\|day&qr_source=gateA` | 集計 |
| GET | `/admin/events/{event_id}/export/submissions.csv` | CSVエクスポート |

---

## 集計APIの返り値例（ダッシュボード用）

**GET** `/admin/events/{event_id}/analytics?from=...&to=...&group_by=hour&qr_source=gateA`

```json
{
  "summary": {
    "scan": 1200,
    "camera_complete": 900,
    "save_click": 650,
    "outbound_click": { "instagram": 410, "x": 80 },
    "submit_complete": 500,
    "consent_agree_rate": 0.72
  },
  "timeseries": [
    { "bucket": "2026-02-09T10:00:00+09:00", "scan": 120, "submit_complete": 40 },
    { "bucket": "2026-02-09T11:00:00+09:00", "scan": 200, "submit_complete": 65 }
  ]
}
```
