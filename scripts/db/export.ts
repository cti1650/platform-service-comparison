import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getDatabase } from "./init.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "../../public/data.json");

interface Service {
  id: number;
  platform: string;
  title: string;
  original_title: string;
  link: string;
  description: string;
  tag: string;
  icon: string;
}

interface PlatformData {
  [platform: string]: Service[];
}

interface ExportData {
  generated_at: string;
  platforms: PlatformData;
  normalization_rules: Array<{
    pattern: string;
    normalized_name: string;
  }>;
}

export async function exportToJson(): Promise<void> {
  const db = await getDatabase();

  // 正規化済みサービスを取得
  const servicesResult = db.exec(`
    SELECT id, platform, title, original_title, link, description, tag, icon
    FROM normalized_services
    ORDER BY platform, title
  `);

  const services: Service[] = [];
  if (servicesResult.length > 0) {
    const columns = servicesResult[0].columns;
    for (const row of servicesResult[0].values) {
      const service: Record<string, unknown> = {};
      columns.forEach((col, idx) => {
        service[col] = row[idx];
      });
      services.push(service as unknown as Service);
    }
  }

  // プラットフォームごとにグループ化
  const platforms: PlatformData = {};
  for (const service of services) {
    if (!platforms[service.platform]) {
      platforms[service.platform] = [];
    }
    platforms[service.platform].push(service);
  }

  // 正規化ルールも出力
  const rulesResult = db.exec(`
    SELECT pattern, normalized_name
    FROM normalization_rules
    WHERE is_regex = 0
    ORDER BY priority DESC
  `);

  const rules: Array<{ pattern: string; normalized_name: string }> = [];
  if (rulesResult.length > 0) {
    for (const row of rulesResult[0].values) {
      rules.push({
        pattern: row[0] as string,
        normalized_name: row[1] as string,
      });
    }
  }

  const exportData: ExportData = {
    generated_at: new Date().toISOString(),
    platforms,
    normalization_rules: rules,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(exportData, null, 2));

  // 統計情報を出力
  console.log("\nExport completed:");
  console.log(`  Output: ${OUTPUT_PATH}`);
  console.log(`  Generated at: ${exportData.generated_at}`);
  console.log("\nService counts by platform:");
  for (const [platform, platformServices] of Object.entries(platforms)) {
    console.log(`  ${platform}: ${platformServices.length}`);
  }

  db.close();
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  exportToJson();
}
