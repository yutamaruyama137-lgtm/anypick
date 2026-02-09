# 計測定義（ダッシュボードの数値をブレさせない）

## 最低KPI（5指標）

| 指標 | トリガー | metrics_events.type | 備考 |
|------|----------|---------------------|------|
| **scan** | `POST /public/sessions` 成功時 | `scan` | 1件追加。ユニークは session_id 単位でOK |
| **撮影完了** | 撮影成功時（クライアント送信） | `camera_complete` | |
| **保存** | 保存ボタン押下 | `save_click` | |
| **外部遷移（IG/X）** | 遷移ボタン押下 | `outbound_click` | `platform`: instagram / x |
| **応募完了** | `POST /public/submissions` 成功時 | `submit_complete` | サーバ側で1件追加 |

## 送信方法

- **scan**：セッション作成API内で `metrics_events` に insert
- **camera_complete / save_click / outbound_click**：クライアントから `POST /public/metrics/batch` で送信
- **submit_complete**：応募API内で `metrics_events` に insert

## 注意

- 実際のSNS投稿完了は外部で完結するため、MVPでは「外部遷移」を成果指標とする
- 後から「投稿URL貼付」などの回収を追加して精度を上げる運用が現実的
