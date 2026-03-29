import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class N8nScraper extends BaseScraper {
  readonly platform: PlatformName = "n8n";
  readonly url = "https://n8n.io/integrations/";

  protected async loadAllContent(): Promise<void> {
    if (!this.page) return;

    // インテグレーションリンクがDOMに存在するまで待機
    console.log('[n8n] Waiting for integration links to load...');
    await this.page.waitForSelector('a[href*="/integrations/"]', { state: 'attached', timeout: 30000 });

    // Load Moreボタンをクリックし続けるか、無限スクロール
    const loadMoreSelector = 'button:has-text("Load more"), button:has-text("Show more"), [class*="load-more"]';

    // まずLoad Moreボタンを試す
    const button = await this.page.$(loadMoreSelector);
    if (button) {
      console.log('[n8n] Found Load More button');
      await this.clickLoadMoreWithWait(loadMoreSelector);
    } else {
      // ボタンが見つからない場合は無限スクロール
      console.log('[n8n] Using infinite scroll...');
      await this.scrollLoadWithWait();
    }
  }

  private async clickLoadMoreWithWait(selector: string): Promise<void> {
    if (!this.page) return;

    let stableCount = 0;
    const maxStableIterations = 5;
    let previousCount = 0;

    while (stableCount < maxStableIterations) {
      const currentCount = await this.page.evaluate(() => {
        return document.querySelectorAll('a[href*="/integrations/"]').length;
      });

      const button = await this.page.$(selector);
      if (!button) {
        console.log('[n8n] No more Load More button');
        break;
      }

      await button.click();

      // 新しいコンテンツが読み込まれるまで待機
      await this.page.waitForFunction(
        (prevCount) => document.querySelectorAll('a[href*="/integrations/"]').length > prevCount,
        currentCount,
        { timeout: 10000 }
      ).catch(() => {});

      const newCount = await this.page.evaluate(() => {
        return document.querySelectorAll('a[href*="/integrations/"]').length;
      });

      if (newCount % 100 === 0 || newCount !== previousCount) {
        console.log(`[n8n] Loaded ${newCount} items...`);
      }

      if (newCount === previousCount) {
        stableCount++;
      } else {
        stableCount = 0;
        previousCount = newCount;
      }
    }
  }

  private async scrollLoadWithWait(): Promise<void> {
    if (!this.page) return;

    let stableCount = 0;
    const maxStableIterations = 10;
    let previousCount = 0;

    while (stableCount < maxStableIterations) {
      const currentCount = await this.page.evaluate(() => {
        return document.querySelectorAll('a[href*="/integrations/"]').length;
      });

      // Load Moreボタンの位置までスクロール（ページ最下部ではなく）
      await this.page.evaluate(() => {
        const loadMoreBtn = document.querySelector('button:has-text("Load more"), button:has-text("Show more"), [class*="load-more"]');
        if (loadMoreBtn) {
          loadMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // ボタンが見つからない場合は少しだけスクロール
          window.scrollBy(0, window.innerHeight);
        }
      });

      // 新しいコンテンツが読み込まれるまで待機
      await this.page.waitForFunction(
        (prevCount) => document.querySelectorAll('a[href*="/integrations/"]').length > prevCount,
        currentCount,
        { timeout: 5000 }
      ).catch(() => {});

      const newCount = await this.page.evaluate(() => {
        return document.querySelectorAll('a[href*="/integrations/"]').length;
      });

      console.log(`[n8n] Loaded ${newCount} items...`);

      if (newCount === previousCount) {
        stableCount++;
      } else {
        stableCount = 0;
        previousCount = newCount;
      }
    }

    console.log(`[n8n] Finished loading, total: ${previousCount} items`);
  }

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    return await this.page.evaluate(() => {
      // /integrations/へのリンクを取得
      const links = document.querySelectorAll('a[href*="/integrations/"]');
      const seen = new Set<string>();
      const services: Array<{title: string; link: string; description: string; tag: string; icon: string}> = [];

      links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href || '';

        // /integrations/直下のみ対象
        if (!href.includes('/integrations/') || href.endsWith('/integrations/') || href.endsWith('/integrations')) return;

        // integrations以降のパスを取得
        const pathMatch = href.match(/\/integrations\/([^/?#]+)/);
        if (!pathMatch || !pathMatch[1]) return;

        const slug = pathMatch[1];

        // 重複チェック（slugで判定）
        if (seen.has(slug)) return;
        seen.add(slug);

        // タイトルと説明を取得
        const titleEl = link.querySelector('h3, strong, [class*="title"], span');
        const descEl = link.querySelector('p');
        const iconEl = link.querySelector('img');

        let title = titleEl?.textContent?.trim() || '';
        if (!title) {
          // リンク内のテキストから取得
          const text = link.textContent?.trim() || '';
          title = text.split('\n')[0].trim();
        }

        // タイトルが空は除外
        if (!title || title.length < 2) return;

        services.push({
          title,
          link: href,
          description: descEl?.textContent?.trim() || "",
          tag: "",
          icon: (iconEl as HTMLImageElement)?.src || "",
        });
      });

      return services;
    });
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new N8nScraper();
  scraper.run().then((result) => {
    console.log(`\nn8n scrape completed: ${result.services.length} services`);
    if (result.error) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });
}
