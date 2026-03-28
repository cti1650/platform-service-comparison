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

// 正規化ルールの初期データ投入
export function seedNormalizationRules(db: Database): void {
  const rules = [
    // X/Twitter
    { pattern: "Twitter", normalized_name: "X (formerly Twitter)", priority: 10 },
    { pattern: "X", normalized_name: "X (formerly Twitter)", priority: 10 },
    { pattern: "X (Twitter)", normalized_name: "X (formerly Twitter)", priority: 10 },

    // Microsoft系
    { pattern: "MS Teams", normalized_name: "Microsoft Teams", priority: 10 },
    { pattern: "Teams", normalized_name: "Microsoft Teams", priority: 5 },
    { pattern: "OneDrive for Business", normalized_name: "Microsoft OneDrive", priority: 10 },
    { pattern: "Excel Online (Business)", normalized_name: "Microsoft Excel", priority: 10 },
    { pattern: "Outlook.com", normalized_name: "Microsoft Outlook", priority: 10 },

    // Google系（日本語→英語）
    { pattern: "Google スプレッドシート", normalized_name: "Google Sheets", priority: 10 },
    { pattern: "Google ドライブ", normalized_name: "Google Drive", priority: 10 },
    { pattern: "Google カレンダー", normalized_name: "Google Calendar", priority: 10 },
    { pattern: "Google ドキュメント", normalized_name: "Google Docs", priority: 10 },
    { pattern: "Google フォーム", normalized_name: "Google Forms", priority: 10 },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO normalization_rules (pattern, normalized_name, is_regex, priority)
    VALUES (?, ?, ?, ?)
  `);

  for (const rule of rules) {
    stmt.run([rule.pattern, rule.normalized_name, 0, rule.priority]);
  }
  stmt.free();

  console.log(`Seeded ${rules.length} normalization rules`);
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const db = await initDatabase();
    seedNormalizationRules(db);
    saveDatabase(db);
    db.close();
  })();
}
