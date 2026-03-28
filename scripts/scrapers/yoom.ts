import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class YoomScraper extends BaseScraper {
  readonly platform: PlatformName = "yoom";
  readonly url = "https://lp.yoom.fun/apps";

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('a[href^="/apps/"]');
      const seen = new Set<string>();

      return Array.from(elements)
        .map((ele) => {
          const href = ele.getAttribute("href") || "";
          // 重複を除去
          if (seen.has(href)) return null;
          seen.add(href);

          const iconEl = ele.querySelector("img");
          const title = ele.textContent?.trim() || "";

          // タイトルが空やカテゴリ名のみの場合はスキップ
          if (!title || title.length < 2) return null;

          return {
            title,
            link: `https://lp.yoom.fun${href}`,
            description: "",
            tag: "",
            icon: (iconEl as HTMLImageElement)?.src || "",
          };
        })
        .filter((item): item is ServiceData => item !== null);
    });
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new YoomScraper();
  scraper.run().then((result) => {
    console.log(`\nYoom scrape completed: ${result.services.length} services`);
    if (result.error) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });
}
