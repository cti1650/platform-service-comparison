import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class IftttScraper extends BaseScraper {
  readonly platform: PlatformName = "ifttt";
  readonly url = "https://ifttt.com/explore/services";

  protected async loadAllContent(): Promise<void> {
    if (!this.page) return;
    // サービスリンクがDOMに存在するまで待機
    console.log('[ifttt] Waiting for service links to load...');
    await this.page.waitForSelector('a[href^="/"]', { state: 'attached', timeout: 30000 });
  }

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    return await this.page.evaluate(() => {
      // 新しいセレクタ: サービスへのリンクを取得
      const links = document.querySelectorAll('a[href^="/"]');
      const seen = new Set<string>();
      const services: Array<{title: string; link: string; description: string; tag: string; icon: string}> = [];

      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        // サービスページへのリンクのみ対象（/explore等は除外）
        if (href.startsWith('/explore') ||
            href.startsWith('/join') ||
            href.startsWith('/login') ||
            href.startsWith('/plans') ||
            href.startsWith('/developers') ||
            href.includes('/applets') ||
            href === '/' ||
            href.length < 3) {
          return;
        }

        // 重複チェック
        if (seen.has(href)) return;
        seen.add(href);

        const img = link.querySelector('img');
        let title = '';

        // img.altから「icon」を除去してタイトルを取得
        if (img?.alt) {
          title = img.alt.replace(/\s*icon$/i, '').trim();
        }

        // altがない場合はリンクテキストから取得
        if (!title) {
          title = link.textContent?.trim() || '';
        }

        // タイトルが空またはナビゲーション系は除外
        if (!title || title.length < 2 || title.includes('IFTTT')) return;

        services.push({
          title,
          link: `https://ifttt.com${href}`,
          description: "",
          tag: "",
          icon: img?.src || "",
        });
      });

      return services;
    });
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new IftttScraper();
  scraper.run().then((result) => {
    console.log(`\nIFTTT scrape completed: ${result.services.length} services`);
    if (result.error) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });
}
