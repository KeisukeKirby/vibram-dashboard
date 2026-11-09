# イベント記録ダッシュボード — 作業状況メモ（2026-11-09 時点）

## 公開先
- URL: https://event-records-dashboard-barefootinc-th.vercel.app （Barefootinc TH メンバーのみ・Vercel ログインが必要）
- Vercel プロジェクト: `event-records-dashboard`（team: barefootinc-th）
- 本番は `feature/event-records` ブランチから手動デプロイ中（main へは未マージ）

## 設定
- DB: Neon `neon-bole-book`（既存の売上データ入り）の中の **`event_records` スキーマ** を使用（環境変数 `DB_SCHEMA=event_records`）。`public` の既存テーブルには触れない。
- 写真・動画: Vercel Blob `event-records-media`（`BLOB_READ_WRITE_TOKEN`）
- トップページは `/events` へリダイレクト（`NEXT_PUBLIC_EVENTS_HOME=1`）

## できていること
- イベント一覧・詳細・追加/編集/削除、写真・動画のアップロード、個別/ZIP ダウンロード
- 初期データ：Terminal 21 Rama 3 ポップアップ（2026/10/17–11/1、写真19・動画5）

## 残り
- 写真から読み取って書いたメモ・割引内容・キャプションの確認
- main へマージ（その後は main への push で自動デプロイ）
- 会期中の売上：この DB の `event_records` には売上データが無いため空欄
