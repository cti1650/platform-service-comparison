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

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- better-sqlite3 (サーバーサイドSQLite)
- Playwright (スクレイピング)
- Google Analytics

## アーキテクチャ

```
[スクレイピング]
Playwright → SQLite (data/services.db)

[フロントエンド]
ブラウザ → Next.js API Routes → better-sqlite3 → SQLite
```

- データは`data/services.db`で一元管理
- サーバーサイドでbetter-sqlite3を使ってSQLiteをクエリ
- 正規化ルールはSQLite VIEWで適用
- クライアントはAPI経由でJSONを取得

## デプロイ

このプロジェクトはVercelでのNext.jsホスティングに対応しています。

### Vercelでのデプロイ手順

1. このリポジトリをGitHubにプッシュ
2. Vercelアカウントでプロジェクトをインポート
3. 自動的にビルド・デプロイが開始されます

## ローカル開発

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバーの起動
npm run start

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
├── src/
│   ├── app/
│   │   ├── layout.tsx      # ルートレイアウト
│   │   ├── page.tsx        # メインページ
│   │   ├── globals.css     # グローバルスタイル
│   │   └── api/
│   │       ├── search/route.ts     # 検索API
│   │       ├── counts/route.ts     # 件数API
│   │       └── platforms/route.ts  # プラットフォーム一覧API
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── PlatformFilter.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── ScrollTopButton.tsx
│   │   └── NoResults.tsx
│   └── lib/
│       └── db.ts           # SQLite接続
├── data/
│   └── services.db         # SQLiteデータベース
├── scripts/
│   ├── db/
│   │   ├── init.ts         # DB初期化・正規化ルール投入
│   │   └── schema.sql      # テーブル・VIEW定義
│   └── scrapers/           # 各プラットフォームのスクレイパー
├── .github/
│   └── workflows/
│       └── scrape.yml      # 週次スクレイピング
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── package.json
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

## API エンドポイント

### GET /api/search
検索条件に基づいてサービス一覧を取得

**パラメータ:**
- `query` - 検索キーワード
- `platform` - プラットフォームフィルター (all, zapier, ifttt, etc.)
- `category` - カテゴリーフィルター (view-all, all, multiple, unique)
- `searchMode` - 検索モード (all, title-only)
- `limit` - 取得件数
- `offset` - オフセット

### GET /api/counts
カテゴリー・プラットフォーム別の件数を取得

### GET /api/platforms
プラットフォーム一覧と件数を取得

## カスタマイズ

- 正規化ルールは `scripts/db/init.ts` の `NORMALIZATION_RULES` で管理
- スタイルは `src/app/globals.css` とTailwind CSSクラスで調整可能
- コンポーネントは `src/components/` 配下で管理
