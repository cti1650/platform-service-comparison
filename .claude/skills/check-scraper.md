# check-scraper

スクレイパーの動作確認を行うスキル。

## トリガー条件
- 「スクレイパーの動作を確認して」
- 「〇〇のスクレイピングをテストして」
- 「スクレイパーが壊れていないか確認」
- 「データ取得できるか試して」

## 実行手順

### 1. Playwrightブラウザのインストール確認
```bash
npx playwright install chromium
```

### 2. スクレイパーをヘッドレスモード無効で実行
```bash
HEADLESS=false npm run scrape:[platform]
```

利用可能なプラットフォーム:
- `zapier`
- `ifttt`
- `make`
- `powerautomate`
- `n8n`
- `yoom`
- `dify`
- `anyflow`

### 3. 結果を確認
```bash
# 件数確認
sqlite3 public/services.db "SELECT platform, COUNT(*) as count FROM raw_services GROUP BY platform ORDER BY count DESC;"

# 最新のスクレイピング履歴
sqlite3 public/services.db "SELECT platform, service_count, status, scraped_at FROM scrape_history ORDER BY scraped_at DESC LIMIT 10;"

# 特定プラットフォームのサンプルデータ
sqlite3 public/services.db "SELECT title, link FROM raw_services WHERE platform = '[platform]' LIMIT 5;"
```

### 4. エラーがある場合
```bash
# エラー履歴を確認
sqlite3 public/services.db "SELECT platform, error_message, scraped_at FROM scrape_history WHERE status = 'error' ORDER BY scraped_at DESC LIMIT 5;"
```

## 全プラットフォーム一括テスト
```bash
npm run scrape
```

## トラブルシューティング

### サイト構造が変わった場合
1. `HEADLESS=false`で実行してブラウザを目視確認
2. 開発者ツールでセレクタを調査
3. `scripts/scrapers/[platform].ts`のセレクタを修正

### タイムアウトする場合
- `base.ts`の`timeout`値を調整
- ネットワーク環境を確認

### 認証が必要な場合
- 一部サイトはログインが必要な場合がある
- 環境変数で認証情報を設定するか、公開ページのみをスクレイピング
