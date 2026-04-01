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
| `scripts/db/init.ts` | 正規化ルール・検索エイリアス定義 |

## Search Aliases

検索時に別名（エイリアス）でもヒットする機能。

### 仕組み
- **正規化ルール** (`NORMALIZATION_RULES`): 表示名の統一 + 検索エイリアスとしても機能
- **検索エイリアス** (`SEARCH_ALIASES`): 正規化ルールにない追加の別名（カタカナ等）

### 例
「Googleスプレッドシート」「Google Spreadsheet」「スプレッドシート」で検索 → 「Google Sheets」がヒット

### 追加方法
`scripts/db/init.ts`の`SEARCH_ALIASES`配列に追加して`npm run db:init`を実行

## MCP Server

AIツール（Claude Desktop等）からサービス検索できるMCPサーバーを提供。

### エンドポイント
- 開発: `http://localhost:3000/mcp/mcp`
- 本番: `https://<domain>/mcp/mcp`

### 利用可能なツール

| ツール名 | 説明 |
|---------|------|
| `search_services` | サービス名で検索（エイリアス対応） |
| `find_platforms_for_services` | 複数サービス全対応のプラットフォームを検索 |
| `get_platforms` | プラットフォーム一覧と対応サービス数 |
| `get_service_detail` | サービス詳細（各プラットフォームのリンク等） |

### 使用例
```
「SlackとGoogle SheetsとNotionを連携したい」
→ find_platforms_for_services(["Slack", "Google Sheets", "Notion"])
→ 6つのプラットフォーム対応: zapier, make, n8n, ifttt, yoom, anyflow
```

## Skills

以下のスキルが利用可能。詳細手順は各SKILL.mdを参照:

- **add-ipaas-platform**: 新規iPaaSプラットフォーム追加
- **add-normalization-rule**: サービス名正規化ルール・検索エイリアス追加
- **check-scraper**: スクレイパー動作確認
- **mcp-server**: MCPサーバーの使用方法とツール追加
