import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class N8nScraper extends BaseScraper {
  readonly platform: PlatformName = "n8n";
  readonly url = "https://n8n.io/integrations/";

  protected async loadAllContent(): Promise<void> {
    if (!this.page) return;

    // ページが読み込まれるまで待機
    await this.page.waitForTimeout(5000);

    // Load Moreボタンをクリックし続けるか、無限スクロール
    const loadMoreSelector = 'button:has-text("Load more"), button:has-text("Show more"), [class*="load-more"]';

    // まずLoad Moreボタンを試す
    let loadMoreFound = false;
    try {
      const button = await this.page.$(loadMoreSelector);
      if (button) {
        loadMoreFound = true;
        console.log('[n8n] Found Load More button');
        await this.clickLoadMoreUntilDone(loadMoreSelector, 200, 2000);
      }
    } catch {
      // ボタンが見つからない場合はスクロール
    }

    // ボタンが見つからない場合は無限スクロール
    if (!loadMoreFound) {
      console.log('[n8n] Using infinite scroll...');
      let previousCount = 0;
      let retries = 0;
      const maxRetries = 100;

      while (retries < maxRetries) {
        // 複数回スクロールを試みる
        for (let i = 0; i < 3; i++) {
          await this.scrollToBottom();
          await this.page.waitForTimeout(500);
        }
        await this.page.waitForTimeout(2000);

        // 現在の要素数を取得
        const currentCount = await this.page.evaluate(() => {
          return document.querySelectorAll('a[href*="/integrations/"]').length;
        });

        console.log(`[n8n] Loaded ${currentCount} items...`);

        if (currentCount === previousCount) {
          retries++;
          if (retries >= 10) break;
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
