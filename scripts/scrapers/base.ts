import type { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getDatabase, saveDatabase } from "../db/init.js";
import type { ServiceData, PlatformName, ScrapeResult } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../../data/services.db");

// puppeteer-extra-plugin-stealth を適用（navigator.webdriver偽装・WebGL/codec/UA整合など
// 多数の自動化痕跡を包括的に隠蔽し、Cloudflare等のbot判定を回避しやすくする）
chromium.use(StealthPlugin());

// ヘッドレスChromeの "HeadlessChrome" 痕跡を含まない一般的なUA
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  abstract readonly platform: PlatformName;
  abstract readonly url: string;

  async init(): Promise<void> {
    // 環境変数 HEADLESS=false でヘッドレスモードを無効化。
    // CIでは xvfb 上でヘッド有り(HEADLESS=false)＋実Chrome を使うとCloudflareの
    // managed challenge を突破しやすい（ヘッドレスchromiumは検知されやすいため）。
    const headless = process.env.HEADLESS !== 'false';
    // BROWSER_CHANNEL=chrome で bundled Chromium ではなく実Google Chromeを使用。
    // 未設定なら undefined となり従来通り bundled Chromium が使われる。
    const channel = process.env.BROWSER_CHANNEL || undefined;
    this.browser = await chromium.launch({
      headless,
      channel,
      args: [
        // navigator.webdriver 等の自動化フラグを無効化（Cloudflare等のbot判定対策）
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    // 追加のステルス痕跡隠蔽は puppeteer-extra-plugin-stealth が担当するため、
    // ここでの手動 addInitScript は不要（二重定義による例外を避けるため削除）。

    this.page = await this.context.newPage();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Cloudflareの "Just a moment..." チャレンジを通過するまで待機する。
   * ステルス処理により多くの場合はJSチャレンジが自動で解決するため、
   * タイトルが通常に戻るのを一定時間ポーリングして待つ。
   */
  protected async passCloudflareChallenge(
    timeoutMs = Number(process.env.CF_WAIT_MS) || 30000
  ): Promise<void> {
    if (!this.page) return;

    const isChallenge = (title: string) =>
      /just a moment|checking your browser|attention required|verify you are (a )?human/i.test(title);

    const start = Date.now();
    let sawChallenge = false;

    while (Date.now() - start < timeoutMs) {
      const title = await this.page.title().catch(() => '');
      if (!isChallenge(title)) {
        if (sawChallenge) {
          console.log(`[${this.platform}] Passed Cloudflare challenge`);
        }
        return;
      }
      sawChallenge = true;
      await this.page.waitForTimeout(2000);
    }

    console.warn(
      `[${this.platform}] Cloudflare challenge still present after ${timeoutMs}ms; continuing anyway`
    );
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

      // Cloudflareチャレンジが出ていれば通過を待つ
      await this.passCloudflareChallenge();

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
