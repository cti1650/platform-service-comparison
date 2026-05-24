import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class MakeScraper extends BaseScraper {
  readonly platform: PlatformName = "make";
  readonly url = "https://www.make.com/en/integrations";

  protected async loadAllContent(): Promise<void> {
    if (!this.page) return;

    // Cookie同意バナーが出ていれば閉じる（あれば押す、なければ無視）
    await this.dismissCookieBanner();

    console.log('[make] Waiting for app cards to load...');
    await this.page.waitForSelector('a[href*="/integrations/"]', { state: 'attached', timeout: 60000 });

    // Load Moreボタンの出現を待つ
    console.log('[make] Waiting for Load More button...');
    await this.page.waitForSelector("[data-cy='load-more']", { state: 'attached', timeout: 30000 }).catch(() => {
      console.log('[make] Load More button not found within timeout (may not be required)');
    });

    // Load Moreボタンをクリックし続ける
    let previousCount = 0;
    let stableCount = 0;

    while (stableCount < 5) {
      const button = await this.page.$("[data-cy='load-more']");
      if (!button) {
        console.log('[make] No more Load More button');
        break;
      }

      const currentCount = await this.page.evaluate(() =>
        document.querySelectorAll('a[href*="/integrations/"]').length
      );

      // 固定ヘッダー等によるinterceptを避けるため、中央にスクロールしてJS経由でクリック
      await button.evaluate((el) => {
        el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        (el as HTMLElement).click();
      });

      // 新しいコンテンツが読み込まれるまで待機
      await this.page.waitForFunction(
        (prevCount) => document.querySelectorAll('a[href*="/integrations/"]').length > prevCount,
        currentCount,
        { timeout: 10000 }
      ).catch(() => {});

      const newCount = await this.page.evaluate(() =>
        document.querySelectorAll('a[href*="/integrations/"]').length
      );

      if (newCount % 100 === 0 || newCount !== previousCount) {
        console.log(`[make] Loaded ${newCount} items...`);
      }

      if (newCount === previousCount) {
        stableCount++;
      } else {
        stableCount = 0;
        previousCount = newCount;
      }
    }

    console.log(`[make] Finished loading, total: ${previousCount} items`);
  }

  private async dismissCookieBanner(): Promise<void> {
    if (!this.page) return;

    const candidates = [
      'button#onetrust-accept-btn-handler',
      'button:has-text("Accept All")',
      'button:has-text("Accept all")',
      'button:has-text("Allow all")',
      'button:has-text("I agree")',
    ];

    for (const selector of candidates) {
      const btn = await this.page.$(selector).catch(() => null);
      if (btn) {
        await btn.click({ timeout: 5000 }).catch(() => {});
        console.log(`[make] Dismissed cookie banner via ${selector}`);
        await this.page.waitForTimeout(500);
        return;
      }
    }
  }

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    return await this.page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/integrations/"]');
      const seen = new Set<string>();

      return Array.from(links).map((ele) => {
        const href = (ele as HTMLAnchorElement).href;

        if (seen.has(href)) return null;
        seen.add(href);

        // /integrations/直下のみ対象
        if (!href.match(/\/integrations\/[^/]+\/?$/)) return null;

        const nameEl = ele.querySelector('h3, strong, [class*="appName"]');
        const iconEl = ele.querySelector('img');

        const title = nameEl?.textContent?.trim() || ele.textContent?.trim().split('\n')[0] || '';
        if (!title || title.length < 2) return null;

        return {
          title,
          link: href,
          description: "",
          tag: "",
          icon: (iconEl as HTMLImageElement)?.src || "",
        };
      }).filter((item): item is ServiceData => item !== null);
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
