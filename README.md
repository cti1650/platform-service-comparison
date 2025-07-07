# iPaaS連携サービス比較ツール

主要iPaaSプラットフォームの連携サービス・コネクターを横断検索・比較するWebアプリケーション

## 概要

このプロジェクトは、主要iPaaS（Integration Platform as a Service）である Zapier、IFTTT、Power Automate、n8n、Make、Yoom、Dify で提供される連携サービス・コネクターを横断的に比較・検索できるWebアプリケーションです。

## 機能

- **連携サービス・コネクターの横断検索機能**
- **iPaaSプラットフォーム別フィルタリング**
- **カテゴリー別フィルタリング**（全プラットフォーム共通、複数プラットフォーム、ユニーク）
- **サービス詳細の表示**（各プラットフォームでの名称・説明・タグ）
- **直接リンク機能**（各プラットフォームのサービスページへ）
- **検索モード切替**（タイトルのみ検索 / 全体検索）
- **サービス名正規化**（プラットフォーム間の表記揺れを統一）
- **レスポンシブデザイン**

## 技術スタック

- React (CDN版)
- Tailwind CSS (CDN版)
- Font Awesome
- Web Workers (検索処理の高速化)
- Google Analytics

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
```

## ファイル構成

```
platform-service-comparison/
├── public/
│   ├── index.html          # メインHTMLファイル
│   ├── js/
│   │   └── ga.js          # Google Analytics設定
│   └── 0057/
│       └── platforms/     # プラットフォームデータ
│           ├── make.js
│           ├── ifttt.js
│           ├── zapier.js
│           ├── powerAutomate.js
│           └── n8n.js
├── package.json
├── vercel.json
└── README.md
```

## データ形式

各プラットフォームのデータは以下の形式で管理されています：

```javascript
const platformServices = [
  {
    title: "サービス名",
    description: "サービスの説明",
    tag: "タグ",
    icon: "アイコンURL",
    link: "サービスURL"
  }
];
```

## カスタマイズ

- プラットフォームデータは `public/0057/platforms/` 内のJavaScriptファイルを編集
- Google Analytics IDは `public/js/ga.js` で変更可能
- スタイルはTailwind CSSクラスで調整可能