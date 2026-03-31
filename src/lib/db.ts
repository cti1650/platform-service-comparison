import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "services.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath, { readonly: true });
  }
  return db;
}

export default getDb;
