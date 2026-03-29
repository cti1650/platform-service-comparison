import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class MakeScraper extends BaseScraper {
  readonly platform: PlatformName = "make";
  readonly url = "https://www.make.com/en/integrations";

  protected async loadAllContent(): Promise<void> {
    if (!this.page) return;

    // ページが読み込まれるまで待機
    await this.page.waitForTimeout(5000);

    // Load Moreボタンをクリックし続ける
    const loadMoreSelectors = [
      "[data-cy='load-more']",
      "button:has-text('Load More')",
      "button:has-text('Load more')",
      "[class*='LoadMore'] button",
      "button[class*='load']",
    ];

    let found = false;
    for (const selector of loadMoreSelectors) {
      try {
        const button = await this.page.$(selector);
        if (button) {
          console.log(`[make] Found Load More button with selector: ${selector}`);
          await this.clickLoadMoreUntilDone(selector, 300, 2000);
          found = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!found) {
      // ボタンが見つからない場合はスクロールで読み込み
      console.log(`[make] No Load More button found, trying scroll...`);
      let previousCount = 0;
      let retries = 0;
      while (retries < 50) {
        await this.scrollToBottom();
        await this.page.waitForTimeout(2000);

        const currentCount = await this.page.evaluate(() => {
          return document.querySelectorAll('a[href*="/integrations/"]').length;
        });
        console.log(`[make] Loaded ${currentCount} items...`);

        if (currentCount === previousCount) {
          retries++;
          if (retries >= 5) break;
        } else {
          retries = 0;
          previousCount = currentCount;
        }
      }
    }
  }

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    return await this.page.evaluate(() => {
      // 複数のセレクタパターンを試行
      const selectors = [
        "a[class*=AppCard_appCard__]",
        "a[href*='/en/integrations/']",
        "[data-cy='app-card'] a",
      ];

      let elements: Element[] = [];
      for (const selector of selectors) {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          elements = Array.from(found);
          break;
        }
      }

      const seen = new Set<string>();
      return elements.map((ele) => {
        const href = (ele as HTMLAnchorElement).href || '';

        // 重複チェック
        if (seen.has(href)) return null;
        seen.add(href);

        // インテグレーションページへのリンクのみ
        if (!href.includes('/integrations/')) return null;

        const nameEl = ele.querySelector("[class*=AppCard_appName__], [class*=appName], h3, strong");
        const iconEl = ele.querySelector("[class*=AppIcon] img, img");

        const title = nameEl?.textContent?.trim() || ele.textContent?.trim().split('\n')[0] || '';
        if (!title || title.length < 2) return null;

        return {
          title,
          link: href,
          description: "",
          tag: "",
          icon: (iconEl as HTMLImageElement)?.src || "",
        };
      }).filter((item): item is {title: string; link: string; description: string; tag: string; icon: string} => item !== null);
    });
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new MakeScraper();
  scraper.run().then((result) => {
    console.log(`\nMake scrape completed: ${result.services.length} services`);
    if (result.error) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });
}
