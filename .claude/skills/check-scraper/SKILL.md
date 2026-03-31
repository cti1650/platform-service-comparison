---
name: check-scraper
description: |
  スクレイパーの動作確認を行うスキル。
  トリガー条件: (1) スクレイパーの動作を確認して (2) 〇〇のスクレイピングをテストして (3) スクレイパーが壊れていないか確認 (4) データ取得できるか試して
---

# スクレイパー動作確認

## 実行手順

### 1. ヘッドレスモード無効で実行
```bash
HEADLESS=false npm run scrape:[platform]
```

プラットフォーム: `zapier`, `ifttt`, `make`, `powerAutomate`, `n8n`, `yoom`, `dify`, `anyflow`

### 2. 結果確認
```bash
# 件数確認
sqlite3 public/services.db "SELECT platform, COUNT(*) FROM raw_services GROUP BY platform ORDER BY COUNT(*) DESC;"

# 履歴確認
sqlite3 public/services.db "SELECT platform, service_count, status, scraped_at FROM scrape_history ORDER BY scraped_at DESC LIMIT 10;"

# エラー確認
sqlite3 public/services.db "SELECT platform, error_message FROM scrape_history WHERE status = 'error' ORDER BY scraped_at DESC LIMIT 5;"
```

## 全プラットフォーム一括テスト
```bash
npm run scrape
```

## トラブルシューティング

| 問題 | 対処 |
|-----|------|
| サイト構造変更 | `HEADLESS=false`で目視確認→セレクタ修正 |
| タイムアウト | `base.ts`のtimeout調整 |
| 認証必要 | 環境変数設定または公開ページのみスクレイピング |
