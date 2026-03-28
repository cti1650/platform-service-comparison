import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName } from "./types.js";

export class DifyScraper extends BaseScraper {
  readonly platform: PlatformName = "dify";
  readonly url = "https://marketplace.dify.ai/";

  protected async loadAllContent(): Promise<void> {
    if (!this.page) return;

    // React RSRでレンダリングされるため、コンテンツが読み込まれるまで待機
    await this.page.waitForTimeout(3000);

    // 無限スクロールまたはLoad Moreがある場合は対応
    let previousHeight = 0;
    let retries = 0;
    const maxRetries = 50;

    while (retries < maxRetries) {
      await this.scrollToBottom();
      await this.page.waitForTimeout(1000);

      const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === previousHeight) {
        retries++;
        if (retries >= 3) break; // 3回連続で変化がなければ終了
      } else {
        retries = 0;
        previousHeight = currentHeight;
      }
    }
  }

  async scrape(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    // Difyのプラグインカードを取得
    return await this.page.evaluate(() => {
      // プラグインカードを探す（複数のセレクタパターンを試行）
      const selectors = [
        "a[href*='/plugins/']",
        "a[href*='/plugin/']",
        "[class*='card'] a",
        "[class*='Card'] a",
        "[class*='plugin']",
        "[class*='Plugin']",
      ];

      let elements: Element[] = [];
      for (const selector of selectors) {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          elements = Array.from(found);
          console.log(`Found ${found.length} elements with selector: ${selector}`);
          break;
        }
      }

      // すべてのリンクを取得してプラグインURLをフィルタ
      if (elements.length === 0) {
        const allLinks = document.querySelectorAll('a[href]');
        elements = Array.from(allLinks).filter(el => {
          const href = (el as HTMLAnchorElement).href;
          return href.includes('plugin') && !href.endsWith('/plugins') && !href.endsWith('/plugins/');
        });
      }

      const seen = new Set<string>();

      return elements
        .map((ele) => {
          const link = (ele as HTMLAnchorElement).href || ele.closest("a")?.href || "";

          // 有効なリンクかチェック
          if (!link || link === '#' || link.endsWith('/plugins') || link.endsWith('/plugins/')) return null;

          // 重複を除去
          if (seen.has(link)) return null;
          seen.add(link);

          // タイトルを取得（複数のパターンを試行）
          const titleSelectors = [
            "h3",
            "h4",
            "[class*='title']",
            "[class*='name']",
            "span",
            "p",
          ];
          let title = "";
          for (const sel of titleSelectors) {
            const titleEl = ele.querySelector(sel);
            if (titleEl?.textContent) {
              title = titleEl.textContent.trim();
              if (title.length > 2 && title.length < 100) break;
            }
          }
          if (!title || title.length < 2) {
            // リンクテキストから取得
            title = ele.textContent?.trim().split("\n")[0]?.trim() || "";
          }

          // 説明を取得
          const descSelectors = [
            "[class*='description']",
            "p:not(:first-child)",
          ];
          let description = "";
          for (const sel of descSelectors) {
            const descEl = ele.querySelector(sel);
            if (descEl?.textContent && descEl.textContent !== title) {
              description = descEl.textContent.trim();
              break;
            }
          }

          // アイコンを取得
          const iconEl = ele.querySelector("img");
          const icon = (iconEl as HTMLImageElement)?.src || "";

          if (!title || title.length < 2) return null;

          return {
            title,
            link,
            description,
            tag: "",
            icon,
          };
        })
        .filter((item): item is {title: string; link: string; description: string; tag: string; icon: string} => item !== null && item.title !== "");
    });
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new DifyScraper();
  scraper.run().then((result) => {
    console.log(`\nDify scrape completed: ${result.services.length} services`);
    if (result.error) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });
}
