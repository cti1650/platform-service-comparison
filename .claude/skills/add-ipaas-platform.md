# add-ipaas-platform

新しいiPaaSプラットフォームを追加するスキル。

## トリガー条件
- 「新しいiPaaSプラットフォームを追加したい」
- 「〇〇というプラットフォームを追加して」
- 「プラットフォームを増やしたい」

## 更新が必要なファイル（5箇所）

### 1. `scripts/scrapers/types.ts` - 型定義
```typescript
export type PlatformName =
  | "zapier"
  | "ifttt"
  // ... 既存のプラットフォーム
  | "newplatform";  // 追加
```

### 2. `scripts/scrapers/[platform].ts` - スクレイパー作成
```typescript
import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class NewPlatformScraper extends BaseScraper {
  readonly platform: PlatformName = "newplatform";
  readonly url = "https://example.com/integrations";

  protected async loadAllContent(): Promise<void> {
    // 必要に応じて無限スクロールやLoad Moreボタンの処理
  }

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('セレクタ');
      return Array.from(elements).map(ele => ({
        title: ele.querySelector('タイトルセレクタ')?.textContent?.trim() || '',
        link: (ele as HTMLAnchorElement).href || '',
        description: ele.querySelector('説明セレクタ')?.textContent?.trim() || '',
        tag: '',
        icon: ele.querySelector('img')?.src || '',
      })).filter(item => item.title);
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new NewPlatformScraper();
  scraper.run().then((result) => {
    console.log(`Scrape completed: ${result.services.length} services`);
    if (result.error) process.exit(1);
  });
}
```

### 3. `package.json` - スクリプト追加
```json
"scrape:newplatform": "npx tsx scripts/scrapers/newplatform.ts"
```

### 4. `public/index.html` - PLATFORMS配列とplatformConfig
```javascript
const PLATFORMS = ['zapier', ..., 'newplatform'];

const platformConfig = {
  // ...
  newplatform: { icon: '🆕', name: 'NewPlatform' },
};
```

### 5. `.github/workflows/scrape.yml` - ワークフローオプション
```yaml
options:
  - all
  # ... 既存のプラットフォーム
  - newplatform
```

## 動作確認

### スクレイパーのテスト（ヘッドレスモード無効）
```bash
HEADLESS=false npm run scrape:newplatform
```

### 結果確認
```bash
sqlite3 public/services.db "SELECT COUNT(*) FROM raw_services WHERE platform = 'newplatform';"
```

## 注意事項
- プラットフォーム数は `schema.sql` と `dbWorker.js` で動的に取得されるため更新不要
- スクレイパー作成前に対象サイトの構造を確認すること
- robots.txt を確認しスクレイピングが許可されているか確認
