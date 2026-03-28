import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class PowerAutomateScraper extends BaseScraper {
  readonly platform: PlatformName = "powerAutomate";
  readonly url = "https://learn.microsoft.com/en-us/connectors/connector-reference/";

  // 複数のフィルターページURLを定義（英語版）
  private readonly filterPages = [
    "https://learn.microsoft.com/en-us/connectors/connector-reference/connector-reference-standard-connectors",
    "https://learn.microsoft.com/en-us/connectors/connector-reference/connector-reference-premium-connectors",
  ];

  protected async loadAllContent(): Promise<void> {
    if (!this.page) return;
    // ページが完全に読み込まれるまで待機
    await this.page.waitForTimeout(3000);
  }

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    const allServices: ServiceData[] = [];
    const seen = new Set<string>();

    // メインページをスクレイピング
    const mainServices = await this.scrapeCurrentPage();
    for (const service of mainServices) {
      if (!seen.has(service.link)) {
        seen.add(service.link);
        allServices.push(service);
      }
    }
    console.log(`[powerAutomate] Main page: ${mainServices.length} services`);

    // 各フィルターページをスクレイピング
    for (const pageUrl of this.filterPages) {
      try {
        await this.page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
        await this.page.waitForTimeout(3000);

        const pageServices = await this.scrapeCurrentPage();
        let newCount = 0;
        for (const service of pageServices) {
          if (!seen.has(service.link)) {
            seen.add(service.link);
            allServices.push(service);
            newCount++;
          }
        }
        console.log(`[powerAutomate] ${pageUrl.split('/').pop()}: ${pageServices.length} services (${newCount} new)`);
      } catch (error) {
        console.error(`[powerAutomate] Error loading ${pageUrl}:`, error);
      }
    }

    return allServices;
  }

  private async scrapeCurrentPage(): Promise<ServiceData[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const services: Array<{title: string; link: string; description: string; tag: string; icon: string}> = [];
      const seen = new Set<string>();

      // テーブル内のすべてのセルからコネクタを取得
      const cells = document.querySelectorAll('table td');

      cells.forEach((cell) => {
        // 各セル内のアイコン画像とリンクのペアを探す
        const imgElements = cell.querySelectorAll('img');
        const linkElements = cell.querySelectorAll('a[href*="/connectors/"]');

        // 最初の有効なリンクを取得
        linkElements.forEach((linkEl) => {
          const link = (linkEl as HTMLAnchorElement).href;

          // 重複チェック
          if (seen.has(link)) return;

          // フィルターページへのリンクは除外
          if (link.includes('connector-reference-')) return;

          // コネクタページへのリンクのみ
          if (!link.includes('/connectors/') || link.endsWith('/connectors/')) return;

          seen.add(link);

          // タイトルを取得 - 太字のテキストを探す
          const title = linkEl.textContent?.trim() || '';
          if (!title || title.length < 2) return;

          // 関連するアイコンを探す
          let icon = '';
          const prevImg = linkEl.previousElementSibling as HTMLImageElement;
          if (prevImg?.tagName === 'IMG') {
            icon = prevImg.src;
          } else {
            // セル内の最初の画像を使用
            const firstImg = cell.querySelector('img');
            if (firstImg) {
              icon = (firstImg as HTMLImageElement).src;
            }
          }

          services.push({
            title,
            link,
            description: "",
            tag: "",
            icon,
          });
        });
      });

      return services;
    });
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new PowerAutomateScraper();
  scraper.run().then((result) => {
    console.log(`\nPower Automate scrape completed: ${result.services.length} services`);
    if (result.error) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });
}
