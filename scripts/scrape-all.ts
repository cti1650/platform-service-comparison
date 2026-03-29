import { ZapierScraper } from "./scrapers/zapier.js";
import { IftttScraper } from "./scrapers/ifttt.js";
import { MakeScraper } from "./scrapers/make.js";
import { PowerAutomateScraper } from "./scrapers/powerAutomate.js";
import { N8nScraper } from "./scrapers/n8n.js";
import { YoomScraper } from "./scrapers/yoom.js";
import { DifyScraper } from "./scrapers/dify.js";
import { AnyflowScraper } from "./scrapers/anyflow.js";
import { initDatabase, seedNormalizationRules, saveDatabase } from "./db/init.js";
import type { ScrapeResult } from "./scrapers/types.js";

async function main() {
  console.log("=== iPaaS Service Scraper ===\n");

  // DBを初期化
  console.log("Initializing database...");
  const db = await initDatabase();
  seedNormalizationRules(db);
  saveDatabase(db);
  db.close();

  // 全スクレイパーを定義
  const scrapers = [
    new ZapierScraper(),
    new IftttScraper(),
    new MakeScraper(),
    new PowerAutomateScraper(),
    new N8nScraper(),
    new YoomScraper(),
    new DifyScraper(),
    new AnyflowScraper(),
  ];

  const results: ScrapeResult[] = [];

  // 順次実行（並列だとサイトに負荷をかけすぎる）
  for (const scraper of scrapers) {
    console.log(`\n--- ${scraper.platform} ---`);
    const result = await scraper.run();
    results.push(result);
  }

  // 結果サマリーを表示
  console.log("\n=== Scrape Summary ===\n");
  let totalServices = 0;
  let hasErrors = false;

  for (const result of results) {
    const status = result.error ? "❌ ERROR" : "✅ OK";
    console.log(`${result.platform}: ${result.services.length} services ${status}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
      hasErrors = true;
    }
    totalServices += result.services.length;
  }

  console.log(`\nTotal: ${totalServices} services`);

  if (hasErrors) {
    console.log("\n⚠️ Some scrapers failed. Check the errors above.");
    process.exit(1);
  }

  console.log("\n✅ All done!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
