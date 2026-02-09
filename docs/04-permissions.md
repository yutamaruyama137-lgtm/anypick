# 権限設計

## 方針：ルーティング分離 + RBAC + マルチテナント強制

- **参加者**：`/e/{event_token}`（ログイン不要、event_tokenのみ）
- **主催者**：`/admin/*`（ログイン必須）
- **DBに tenant_id を持たせ、API側で必ず tenant_id を強制フィルタ**  
  → フロントから tenant_id を渡させない（改ざん対策）

## 役割（role）

| 役割 | 説明 |
|------|------|
| `organizer_admin` | 自社(tenant)のイベント作成/編集/閲覧 |
| `organizer_viewer` | 閲覧のみ |
| `super_admin` | 全テナント |

## 実装上の注意

- Admin API では `req.user.tenant_id` を必ず WHERE に含める
- イベント取得・更新・削除はすべて `tenant_id` 一致を条件にする
- 応募一覧・DL・分析もイベント経由で tenant を確定する
