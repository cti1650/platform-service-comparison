---
name: add-ipaas-platform
description: |
  新しいiPaaSプラットフォームをプロジェクトに追加するスキル。
  トリガー条件: (1) 新しいiPaaSプラットフォームを追加したい (2) 〇〇というプラットフォームを追加して (3) プラットフォームを増やしたい
---

# 新規iPaaSプラットフォーム追加

## 更新が必要なファイル（4箇所）

### 1. `scripts/scrapers/types.ts` - 型定義
```typescript
export type PlatformName = "zapier" | ... | "newplatform";
```

### 2. `scripts/scrapers/[platform].ts` - スクレイパー作成
```typescript
import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class NewPlatformScraper extends BaseScraper {
  readonly platform: PlatformName = "newplatform";
  readonly url = "https://example.com/integrations";

  protected async loadAllContent(): Promise<void> {
    await this.page?.waitForSelector('セレクタ', { state: 'attached', timeout: 30000 });
    // 必要に応じてLoad Moreボタン処理
  }

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");
    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('セレクタ');
      return Array.from(elements).map(ele => ({
        title: ele.querySelector('タイトル')?.textContent?.trim() || '',
        link: (ele as HTMLAnchorElement).href || '',
        description: '',
        tag: '',
        icon: ele.querySelector('img')?.src || '',
      })).filter(item => item.title);
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  new NewPlatformScraper().run();
}
```

### 3. `package.json` - スクリプト追加
```json
"scrape:newplatform": "npx tsx scripts/scrapers/newplatform.ts"
```

### 4. `.github/workflows/scrape.yml` - ワークフローオプション
```yaml
options:
  - newplatform
```

## 更新不要なファイル

- **フロントエンド**: プラットフォーム一覧は`getPlatforms()`でDBから動的取得されるため、コード変更不要
- **プラットフォーム数**: スキーマで動的取得のため更新不要

## 動作確認

```bash
HEADLESS=false npm run scrape:newplatform
sqlite3 data/services.db "SELECT COUNT(*) FROM raw_services WHERE platform = 'newplatform';"
```

## 注意事項
- 対象サイトの構造とrobots.txtを事前確認
- スクレイピング後、`npm run dev`で新プラットフォームが自動的にフィルターに表示される
