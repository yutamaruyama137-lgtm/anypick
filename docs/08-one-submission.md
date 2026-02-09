# 「1人1回」制限の実装（現場運用に強い順）

## P0：セッション単位で提出ロック

- `submissions` に `unique(event_id, session_id)` を設定
- 1セッション1応募まで。同一ブラウザで再度「応募」しようとしたらエラーまたは「提出済み」表示

## P1推奨：ワンタイムQR（ticket_codes）

- 入場券/リストバンドにコードを印字
- 参加者が `/public/tickets/claim` で `ticket_code` を消費 → `ticket_id` を session に紐づけ
- **賞金が絡むならこれが最強**（物理的に1人1枚）

## P2：SMS等

- 認証コスト・摩擦が大きいため、最後の手段として検討
