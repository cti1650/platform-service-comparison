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

      return links.map((ele) => {
        const href = (ele as HTMLAnchorElement).href;

        // タイトルを取得（リンク内のテキストから）
        const text = ele.textContent?.trim() || "";
        // カテゴリ名を除去してタイトルを抽出
        const categories = [
          "営業",
          "マーケティング",
          "グループウェア",
          "コミュニケーション",
          "人事・労務",
          "財務・会計",
          "ECサイト・決済",
          "契約・法務",
          "開発・運用",
          "データ",
          "セキュリティ",
          "プロジェクト管理",
          "ESG",
        ];
        let title = text;
        for (const cat of categories) {
          if (title.includes(cat)) {
            title = title.split(cat)[0].trim();
            break;
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

        // 説明文を抽出（カテゴリ名以降のテキスト）
        let description = "";
        for (const cat of categories) {
          if (text.includes(cat)) {
            const parts = text.split(cat);
            if (parts[1]) {
              description = parts[1].trim();
            }
            break;
          }
        }

        // アイコンを取得
        const img = ele.querySelector("img");
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
