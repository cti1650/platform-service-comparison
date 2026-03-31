import { chromium, Browser, Page } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getDatabase, saveDatabase } from "../db/init.js";
import type { ServiceData, PlatformName, ScrapeResult } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../../data/services.db");

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  abstract readonly platform: PlatformName;
  abstract readonly url: string;

  async init(): Promise<void> {
    // 環境変数 HEADLESS=false でヘッドレスモードを無効化
    const headless = process.env.HEADLESS !== 'false';
    this.browser = await chromium.launch({
      headless,
    });
    this.page = await this.browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    await this.page.setViewportSize({ width: 1280, height: 800 });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  abstract scrape(): Promise<ServiceData[]>;

  protected async loadAllContent(): Promise<void> {
    // デフォルト実装: 何もしない
    // 必要に応じてサブクラスでオーバーライド（Load Moreボタンのクリックなど）
  }

  async run(): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      platform: this.platform,
      services: [],
      scrapedAt: new Date(),
    };

    try {
      await this.init();
      console.log(`[${this.platform}] Navigating to ${this.url}`);

      await this.page!.goto(this.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      console.log(`[${this.platform}] Page loaded, loading all content...`);

      await this.loadAllContent();
      console.log(`[${this.platform}] Scraping services...`);

      result.services = await this.scrape();
      console.log(`[${this.platform}] Found ${result.services.length} services`);

      await this.saveToDatabase(result);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`[${this.platform}] Error:`, result.error);
      await this.logError(result.error);
    } finally {
      await this.close();
    }

    return result;
  }

  protected async saveToDatabase(result: ScrapeResult): Promise<void> {
    const db = await getDatabase();

    // 既存データを削除
    db.run("DELETE FROM raw_services WHERE platform = ?", [this.platform]);

    // 新しいデータを挿入
    const stmt = db.prepare(`
      INSERT INTO raw_services (platform, title, link, description, tag, icon, scraped_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const service of result.services) {
      stmt.run([
        this.platform,
        service.title,
        service.link,
        service.description || "",
        service.tag || "",
        service.icon || "",
        result.scrapedAt.toISOString(),
      ]);
    }
    stmt.free();

    // 履歴を記録
    db.run(
      `INSERT INTO scrape_history (platform, service_count, status)
       VALUES (?, ?, ?)`,
      [this.platform, result.services.length, "success"]
    );

    saveDatabase(db, DB_PATH);
    db.close();

    console.log(`[${this.platform}] Saved ${result.services.length} services to database`);
  }

  protected async logError(errorMessage: string): Promise<void> {
    const db = await getDatabase();

    db.run(
      `INSERT INTO scrape_history (platform, service_count, status, error_message)
       VALUES (?, 0, 'error', ?)`,
      [this.platform, errorMessage]
    );

    saveDatabase(db, DB_PATH);
    db.close();
  }

  protected async scrollToBottom(): Promise<void> {
    if (!this.page) return;

    await this.page.evaluate(() => {
      const element = document.documentElement;
      const bottom = element.scrollHeight - element.clientHeight;
      window.scroll(0, bottom);
    });
  }

  protected async clickLoadMoreUntilDone(
    selector: string,
    maxIterations = 100,
    delay = 1000
  ): Promise<void> {
    if (!this.page) return;

    for (let i = 0; i < maxIterations; i++) {
      const button = await this.page.$(selector);
      if (!button) {
        console.log(`[${this.platform}] No more Load More button found`);
        break;
      }

      await button.click();
      await this.scrollToBottom();
      await this.page.waitForTimeout(delay);
    }
  }
}
