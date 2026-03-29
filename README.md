# iPaaS連携サービス比較ツール

主要iPaaSプラットフォームの連携サービス・コネクターを横断検索・比較するWebアプリケーション

## 概要

このプロジェクトは、主要iPaaS（Integration Platform as a Service）である Zapier、IFTTT、Power Automate、n8n、Make、Yoom、Dify、Anyflow で提供される連携サービス・コネクターを横断的に比較・検索できるWebアプリケーションです。

## 機能

- **連携サービス・コネクターの横断検索機能**
- **iPaaSプラットフォーム別フィルタリング**（連携数順にソート）
- **カテゴリー別フィルタリング**（全プラットフォーム共通、複数プラットフォーム、ユニーク）
- **サービス詳細の表示**（各プラットフォームでの名称・説明・タグ）
- **直接リンク機能**（各プラットフォームのサービスページへ）
- **検索モード切替**（タイトルのみ検索 / 全体検索）
- **サービス名正規化**（プラットフォーム間の表記揺れをSQLiteで統一）
- **レスポンシブデザイン**

## 技術スタック

- React (CDN版)
- Tailwind CSS (CDN版)
- Font Awesome
- sql.js (ブラウザ上でSQLiteを直接クエリ)
- Web Workers (DB操作の非同期処理)
- SQLite (データ管理)
- Playwright (スクレイピング)
- Google Analytics

## アーキテクチャ

```
[スクレイピング]
Playwright → SQLite (public/services.db)

[フロントエンド]
ブラウザ → sql.js (WASM) → SQLiteを直接クエリ
```

- データは`public/services.db`で一元管理
- ブラウザ上でsql.jsを使ってSQLiteを直接クエリ
- 正規化ルールはSQLite VIEWで適用

## デプロイ

このプロジェクトはVercelでの静的サイトホスティングに対応しています。

### Vercelでのデプロイ手順

1. このリポジトリをGitHubにプッシュ
2. Vercelアカウントでプロジェクトをインポート
3. 自動的にデプロイが開始されます

## ローカル開発

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# データベース初期化（スキーマ適用・正規化ルール投入）
npm run db:init

# 全プラットフォームをスクレイピング
npm run scrape

# 個別プラットフォームをスクレイピング
npm run scrape:zapier
npm run scrape:ifttt
npm run scrape:make
npm run scrape:powerautomate
npm run scrape:n8n
npm run scrape:yoom
npm run scrape:dify
npm run scrape:anyflow
```

## ファイル構成

```
platform-service-comparison/
├── public/
│   ├── index.html          # メインHTMLファイル
│   ├── services.db         # SQLiteデータベース
│   └── js/
│       ├── ga.js           # Google Analytics設定
│       └── dbWorker.js     # sql.js Web Worker
├── scripts/
│   ├── db/
│   │   ├── init.ts         # DB初期化・正規化ルール投入
│   │   └── schema.sql      # テーブル・VIEW定義
│   └── scrapers/           # 各プラットフォームのスクレイパー
├── .github/
│   └── workflows/
│       └── scrape.yml      # 週次スクレイピング
├── package.json
├── vercel.json
└── README.md
```

## データベーススキーマ

### テーブル
- `raw_services` - スクレイピング結果（生データ）
- `normalization_rules` - サービス名正規化ルール
- `scrape_history` - スクレイピング履歴

### VIEW
- `normalized_services` - 正規化適用済みサービス
- `grouped_services` - タイトルごとのプラットフォーム数
- `category_counts` - カテゴリ別件数
- `platform_counts` - プラットフォーム別件数

## カスタマイズ

- 正規化ルールは `scripts/db/init.ts` の `NORMALIZATION_RULES` で管理
- Google Analytics IDは `public/js/ga.js` で変更可能
- スタイルはTailwind CSSクラスで調整可能
