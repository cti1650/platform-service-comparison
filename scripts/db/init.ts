import initSqlJs, { Database } from "sql.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../../data/services.db");
const SCHEMA_PATH = join(__dirname, "schema.sql");

let sqlPromise: Promise<typeof import("sql.js")> | null = null;

async function getSql() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs();
  }
  return sqlPromise;
}

export async function initDatabase(): Promise<Database> {
  const SQL = await getSql();

  let db: Database;
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  const schema = readFileSync(SCHEMA_PATH, "utf-8");
  db.run(schema);

  console.log(`Database initialized at ${DB_PATH}`);
  return db;
}

export async function getDatabase(): Promise<Database> {
  const SQL = await getSql();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    return new SQL.Database(buffer);
  }

  return new SQL.Database();
}

export function saveDatabase(db: Database, path: string = DB_PATH): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(path, buffer);
}

// 正規化ルールをリセット（全削除）
export function resetNormalizationRules(db: Database): void {
  db.run("DELETE FROM normalization_rules");
  console.log("Normalization rules reset");
}

// 正規化ルールの定義
const NORMALIZATION_RULES = [
  // X/Twitter（各プラットフォームの表記ゆれ対応）
  { pattern: "Twitter", normalized_name: "X (formerly Twitter)", priority: 10 },
  { pattern: "X", normalized_name: "X (formerly Twitter)", priority: 10 },
  { pattern: "X (Twitter)", normalized_name: "X (formerly Twitter)", priority: 10 },
  { pattern: "X（Twitter）", normalized_name: "X (formerly Twitter)", priority: 10 },
  { pattern: "X (Formerly Twitter)", normalized_name: "X (formerly Twitter)", priority: 10 },

  // Microsoft系
  { pattern: "MS Teams", normalized_name: "Microsoft Teams", priority: 10 },
  { pattern: "Teams", normalized_name: "Microsoft Teams", priority: 5 },
  { pattern: "OneDrive for Business", normalized_name: "Microsoft OneDrive", priority: 10 },
  { pattern: "Excel Online (Business)", normalized_name: "Microsoft Excel", priority: 10 },
  { pattern: "Outlook.com", normalized_name: "Microsoft Outlook", priority: 10 },

  // Google系（日本語→英語）
  { pattern: "Google スプレッドシート", normalized_name: "Google Sheets", priority: 10 },
  { pattern: "Googleスプレッドシート", normalized_name: "Google Sheets", priority: 10 },
  { pattern: "Google ドライブ", normalized_name: "Google Drive", priority: 10 },
  { pattern: "Google Drive™", normalized_name: "Google Drive", priority: 10 },
  { pattern: "Google カレンダー", normalized_name: "Google Calendar", priority: 10 },
  { pattern: "Googleカレンダー", normalized_name: "Google Calendar", priority: 10 },
  { pattern: "Google ドキュメント", normalized_name: "Google Docs", priority: 10 },
  { pattern: "Googleドキュメント", normalized_name: "Google Docs", priority: 10 },
  { pattern: "Google フォーム", normalized_name: "Google Forms", priority: 10 },
  { pattern: "Googleフォーム", normalized_name: "Google Forms", priority: 10 },
  { pattern: "Googleコンタクト", normalized_name: "Google Contacts", priority: 10 },
  { pattern: "Googleビジネスプロフィール", normalized_name: "Google Business Profile", priority: 10 },
  { pattern: "Google アナリティクス", normalized_name: "Google Analytics", priority: 10 },
  { pattern: "Google 検索", normalized_name: "Google Search", priority: 10 },

  // AI系サービス
  { pattern: "Anthropic（Claude）", normalized_name: "Anthropic Claude", priority: 10 },
  { pattern: "Anthropic (Claude)", normalized_name: "Anthropic Claude", priority: 10 },
  { pattern: "Claude", normalized_name: "Anthropic Claude", priority: 5 },
  { pattern: "OpenAI (ChatGPT, Sora, DALL-E, Whisper)", normalized_name: "OpenAI", priority: 10 },

  // LINE系
  { pattern: "LINE公式アカウント", normalized_name: "LINE Official Account", priority: 10 },
  { pattern: "LINE広告", normalized_name: "LINE Ads", priority: 10 },
  { pattern: "LINE（現在利用不可）", normalized_name: "LINE", priority: 10 },

  // Notion
  { pattern: "Notion.so", normalized_name: "Notion", priority: 10 },

  // Salesforce
  { pattern: "Salesforce（Sandbox環境）", normalized_name: "Salesforce Sandbox", priority: 10 },

  // kintone（大文字小文字の統一）
  { pattern: "Kintone", normalized_name: "kintone", priority: 10 },
  { pattern: "Kintone (Legacy)", normalized_name: "kintone", priority: 10 },

  // Jira（製品名の統一）
  { pattern: "Jira Cloud Platform", normalized_name: "Jira", priority: 10 },
  { pattern: "Jira Software", normalized_name: "Jira", priority: 10 },
  { pattern: "JIRA Search (Independent Publisher)", normalized_name: "Jira", priority: 10 },

  // HubSpot
  { pattern: "HubSpot CRM", normalized_name: "HubSpot", priority: 10 },

  // Mailchimp（大文字小文字の統一）
  { pattern: "MailChimp", normalized_name: "Mailchimp", priority: 10 },

  // monday.com（表記統一）
  { pattern: "Monday.com", normalized_name: "monday.com", priority: 10 },
  { pattern: "monday", normalized_name: "monday.com", priority: 10 },
  { pattern: "mondaycom (Independent Publisher)", normalized_name: "monday.com", priority: 10 },

  // WordPress（大文字小文字の統一）
  { pattern: "Wordpress", normalized_name: "WordPress", priority: 10 },
  { pattern: "WordPress.org", normalized_name: "WordPress", priority: 10 },

  // DocuSign（大文字小文字の統一）
  { pattern: "Docusign", normalized_name: "DocuSign", priority: 10 },

  // SendGrid（日本語サフィックス除去）
  { pattern: "SendGrid メール", normalized_name: "SendGrid", priority: 10 },

  // Zoom
  { pattern: "Zoom Meetings (Independent Publisher)", normalized_name: "Zoom", priority: 10 },
];

// 正規化ルールの初期データ投入（重複は自動的にスキップ）
export function seedNormalizationRules(db: Database, reset = false): void {
  if (reset) {
    resetNormalizationRules(db);
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO normalization_rules (pattern, normalized_name, is_regex, priority)
    VALUES (?, ?, ?, ?)
  `);

  let inserted = 0;
  for (const rule of NORMALIZATION_RULES) {
    stmt.run([rule.pattern, rule.normalized_name, 0, rule.priority]);
    if (db.getRowsModified() > 0) {
      inserted++;
    }
  }
  stmt.free();

  console.log(`Seeded ${inserted} new normalization rules (${NORMALIZATION_RULES.length} total defined)`);
}

// スクリプトとして実行された場合
// 引数: --reset でルールをリセットしてから投入
if (import.meta.url === `file://${process.argv[1]}`) {
  const reset = process.argv.includes("--reset");
  (async () => {
    const db = await initDatabase();
    seedNormalizationRules(db, reset);
    saveDatabase(db);
    db.close();
  })();
}
