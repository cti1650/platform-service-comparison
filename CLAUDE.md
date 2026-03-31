# CLAUDE.md

## Project Overview

Next.js製のiPaaS連携サービス比較ツール。Zapier, IFTTT, Make, Power Automate, n8n, Yoom, Dify, Anyflowの連携サービスを横断検索・比較できる。

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- SQLite (better-sqlite3) - サーバーサイド
- Playwright (スクレイピング)

## Commands

```bash
npm run dev      # 開発サーバー
npm run build    # ビルド
npm run scrape   # 全プラットフォームスクレイピング
npm run db:init  # DB初期化・正規化ルール適用
```

## Architecture

```
[Initial Load]
Server Component (page.tsx) → services.ts → SQLite → props → Client Component

[Filter Changes]
Client Component → API Routes → SQLite → JSON
```

- 初回表示: Server Componentで直接データ取得（ローディングなし）
- フィルター変更時: API経由でデータ取得
- プラットフォーム一覧: DBから動的取得（ハードコードなし）

## Key Files

| Path | Description |
|------|-------------|
| `src/app/page.tsx` | Server Component（初期データ取得） |
| `src/components/ServiceSearch.tsx` | Client Component（メインUI） |
| `src/lib/services.ts` | 共有関数（searchServices, getCounts, getPlatforms） |
| `src/types/index.ts` | 共通型定義 |
| `data/services.db` | SQLiteデータベース |
| `scripts/db/init.ts` | 正規化ルール定義 |

## Skills

以下のスキルが利用可能。詳細手順は各SKILL.mdを参照:

- **add-ipaas-platform**: 新規iPaaSプラットフォーム追加
- **add-normalization-rule**: サービス名正規化ルール追加
- **check-scraper**: スクレイパー動作確認
