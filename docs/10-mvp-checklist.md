# MVPチェックリスト（開発開始用）

開発着手時は以下を順に実装すると、現場運用まで最短で届く。

- [ ] イベント作成（event_token 発行）
- [ ] フレームアップロード（署名PUT）
- [ ] QR生成（event_token + qr_source_code）
- [ ] `POST /public/sessions`（scan 計測含む）
- [ ] カメラ → 合成 → アップロード → `POST /public/submissions`
- [ ] `POST /public/metrics/batch`（save / outbound）
- [ ] Admin analytics（集計API・ダッシュボード表示）
- [ ] 応募一覧 ＋ 同意フィルタ ＋ DL（署名URL）

## 次のステップ候補

- **OpenAPI（Swagger）** 形式のAPI仕様
- **集計SQL**（scan/capture/save/outbound/submit を高速に出すクエリ）
- **ワンタイムQR** の最適オペ（印刷フォーマット / PDFテンプレ）
