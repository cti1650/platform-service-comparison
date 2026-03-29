import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName, ScrapeResult } from "./types.js";

export class AnyflowScraper extends BaseScraper {
  readonly platform: PlatformName = "anyflow";
  readonly url = "https://anyflow.jp/connectors";

  // カテゴリ一覧
  private readonly categories = [
    "sales",
    "marketing",
    "groupware",
    "communication",
    "hr_labor",
    "finance_accounting",
    "ecommerce_payment",
    "contract_legal",
    "development_operations",
    "data",
    "security",
    "project_management",
    "esg",
  ];

  async run(): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      platform: this.platform,
      services: [],
      scrapedAt: new Date(),
    };
    const seen = new Set<string>();

    try {
      await this.init();

      // 各カテゴリページをスクレイプ
      for (const category of this.categories) {
        const categoryUrl = `https://anyflow.jp/connectors/search/${category}`;
        console.log(`[anyflow] Scraping category: ${category}`);

        await this.page!.goto(categoryUrl, {
          waitUntil: "networkidle",
          timeout: 60000,
        });
        await this.page!.waitForTimeout(2000);

        const services = await this.scrapeCategory();

        // 重複を除去して追加
        for (const service of services) {
          if (!seen.has(service.link)) {
            seen.add(service.link);
            result.services.push(service);
          }
        }

        console.log(
          `[anyflow] Found ${services.length} in ${category} (total: ${result.services.length})`
        );
      }

      console.log(`[anyflow] Total unique connectors: ${result.services.length}`);

      // DBに保存
      await this.saveToDatabase(result);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`[anyflow] Error: ${result.error}`);
      await this.logError(result.error);
    } finally {
      await this.close();
    }

    return result;
  }

  private async scrapeCategory(): Promise<ServiceData[]> {
    if (!this.page) throw new Error("Page not initialized");

    return await this.page.evaluate(() => {
      // コネクタへのリンクを取得
      const links = Array.from(
        document.querySelectorAll('a[href*="/connectors/"]')
      ).filter((a) => {
        const href = (a as HTMLAnchorElement).href;
        return !href.includes("/search/") && href.includes("/connectors/");
      });

      // カテゴリ名パターン（様々な表記に対応、長いパターンを先に配置）
      const categoryPatterns = [
        "プロジェクト管理",
        "マーケティング",
        "グループウェア",
        "コミュニケーション",
        "人事・労務",
        "人事/労務",
        "人事労務",
        "財務・会計",
        "財務/会計",
        "ECサイト・決済",
        "EC・決済",
        "EC/決済",
        "契約・法務",
        "契約/法務",
        "開発・運用",
        "開発/運用",
        "セキュリティ",
        "営業",
        "データ",
        "会計",
        "契約",
        "ESG",
      ];

      return links.map((ele) => {
        const href = (ele as HTMLAnchorElement).href;
        const img = ele.querySelector("img");

        // タイトル取得: p.text.sd.appear 要素があればそこから取得
        let title = "";
        const pElement = ele.querySelector("p.text.sd.appear");
        if (pElement) {
          title = pElement.textContent?.trim() || "";
        }

        // pがない場合、img要素のalt属性を試行
        if (!title) {
          title = img?.alt?.trim() || "";
        }

        // altもない場合はテキストからカテゴリ部分を除去
        if (!title) {
          const text = ele.textContent?.trim() || "";
          title = text;
          // カテゴリ名以降をすべて除去
          for (const cat of categoryPatterns) {
            const idx = title.indexOf(cat);
            if (idx !== -1) {
              title = title.substring(0, idx).trim();
              break;
            }
          }
        }

        // URLからタイトルを抽出（フォールバック）
        if (!title) {
          const match = href.match(/\/connectors\/([^/]+)/);
          if (match) {
            title = match[1]
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
          }
        }

        // 説明文を取得（別の要素から取得を試みる）
        let description = "";
        const descEl = ele.querySelector("p:not(.text.sd.appear)");
        if (descEl) {
          description = descEl.textContent?.trim() || "";
        }

        // アイコンを取得
        const icon = img?.src || "";

        return {
          title,
          link: href,
          description,
          tag: "",
          icon,
        };
      });
    });
  }

  // BaseScraperの抽象メソッドを実装
  async scrape(): Promise<ServiceData[]> {
    return [];
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new AnyflowScraper();
  scraper.run().then((result) => {
    console.log(`\nAnyflow scrape completed: ${result.services.length} services`);
    if (result.error) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });
}
