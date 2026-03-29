import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class ZapierScraper extends BaseScraper {
  readonly platform: PlatformName = "zapier";
  readonly url = "https://zapier.com/apps";

  protected async loadAllContent(): Promise<void> {
    if (!this.page) return;

    // ページが読み込まれるまで待機
    await this.page.waitForTimeout(5000);

    // Zapierは無限スクロール + ボタンの組み合わせ
    // まずスクロールして全てのコンテンツを読み込む
    console.log('[zapier] Loading content via scroll...');

    let previousCount = 0;
    let retries = 0;
    const maxRetries = 100;

    while (retries < maxRetries) {
      // スクロール
      await this.scrollToBottom();
      await this.page.waitForTimeout(1500);

      // Load Moreボタンがあればクリック
      try {
        const button = await this.page.$('button:has-text("Load more")');
        if (button) {
          await button.click();
          console.log('[zapier] Clicked Load more button');
          await this.page.waitForTimeout(2000);
        }
      } catch {
        // ボタンがない場合は無視
      }

      // 現在の要素数を取得
      const currentCount = await this.page.evaluate(() => {
        return document.querySelectorAll('a[href*="/apps/"]').length;
      });

      if (currentCount % 100 === 0 || currentCount !== previousCount) {
        console.log(`[zapier] Loaded ${currentCount} items...`);
      }

      if (currentCount === previousCount) {
        retries++;
        if (retries >= 10) {
          console.log(`[zapier] No new items after ${retries} retries, stopping`);
          break;
        }
      } else {
        retries = 0;
        previousCount = currentCount;
      }
    }

    console.log(`[zapier] Finished loading, total: ${previousCount} items`);
  }

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    return await this.page.evaluate(() => {
      // 複数のセレクタパターンを試行
      const selectors = [
        "main section ul[aria-label] li a[data-testid='category-app-card--item']",
        "a[href*='/apps/'][href*='/integrations']",
        "li a[href*='/apps/']",
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
      return elements
        .map((ele) => {
          const href = (ele as HTMLAnchorElement).href || '';

          // 重複チェック
          if (seen.has(href)) return null;
          seen.add(href);

          // エラーマーク付きのものはスキップ
          if (ele.querySelector("span[data-color=error]")) return null;

          // タイトルを取得
          const iconEl = ele.querySelector("img");
          let title = '';

          // h2からタイトルを取得（data-testid="category-app-card--item"のカード内）
          const h2El = ele.querySelector("h2");
          if (h2El?.textContent) {
            title = h2El.textContent.trim();
          }

          // h2がない場合はh3を試行
          if (!title) {
            const h3El = ele.querySelector("h3");
            if (h3El?.textContent) {
              title = h3El.textContent.trim();
            }
          }

          // URLからアプリ名を抽出（最終手段）
          if (!title && href.includes('/apps/')) {
            const match = href.match(/\/apps\/([^/]+)/);
            if (match) {
              // URLスラッグをタイトルに変換（例: google-sheets → Google Sheets）
              title = match[1]
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
          }

          if (!title || title.length < 2) return null;

          // 説明文は別途取得（タイトルとの連結を避ける）
          let description = '';
          const descEl = ele.querySelector("[class*=description], p");
          if (descEl?.textContent) {
            const descText = descEl.textContent.trim();
            // タイトルと異なる場合のみ説明として使用
            if (descText !== title && !title.includes(descText)) {
              description = descText;
            }
          }

          const tagEl = ele.querySelector("[class*=tag], [class*=badge]");

          return {
            title,
            link: href,
            description,
            tag: tagEl?.textContent?.trim() || "",
            icon: (iconEl as HTMLImageElement)?.src || "",
          };
        })
        .filter((item): item is {title: string; link: string; description: string; tag: string; icon: string} => item !== null && item.title !== "");
    });
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new ZapierScraper();
  scraper.run().then((result) => {
    console.log(`\nZapier scrape completed: ${result.services.length} services`);
    if (result.error) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });
}
