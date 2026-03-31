import getDb from "@/lib/db";
import type {
  Service,
  CategoryCounts,
  PlatformCount,
  ApiCounts,
} from "@/types";

interface ServiceRow {
  title: string;
  platforms: string;
  platform_count: number;
  details: string;
}

export interface SearchParams {
  query?: string;
  platform?: string;
  category?: string;
  searchMode?: string;
  limit?: number;
  offset?: number;
}

export function searchServices(params: SearchParams = {}): Service[] {
  const {
    query = "",
    platform = "all",
    category = "view-all",
    searchMode = "full",
    limit = 2000,
    offset = 0,
  } = params;

  const db = getDb();

  let sql = `
    SELECT
      title,
      GROUP_CONCAT(DISTINCT platform) as platforms,
      COUNT(DISTINCT platform) as platform_count,
      json_group_object(platform, json_object(
        'original_title', original_title,
        'link', link,
        'description', description,
        'tag', tag,
        'icon', icon
      )) as details
    FROM normalized_services
    WHERE 1=1
  `;
  const sqlParams: (string | number)[] = [];

  if (query) {
    const keywords = query.split(" ").filter((k) => k);
    keywords.forEach((keyword) => {
      if (searchMode === "title-only") {
        sql += ` AND title LIKE ?`;
        sqlParams.push(`%${keyword}%`);
      } else {
        sql += ` AND (title LIKE ? OR description LIKE ? OR tag LIKE ?)`;
        sqlParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
    });
  }

  if (platform && platform !== "all") {
    sql += ` AND platform = ?`;
    sqlParams.push(platform);
  }

  sql += ` GROUP BY title`;

  if (category === "all") {
    sql += ` HAVING platform_count = 8`;
  } else if (category === "multiple") {
    sql += ` HAVING platform_count >= 2`;
  } else if (category === "unique") {
    sql += ` HAVING platform_count = 1`;
  }

  sql += ` ORDER BY platform_count DESC, title LIMIT ? OFFSET ?`;
  sqlParams.push(limit, offset);

  const results = db.prepare(sql).all(...sqlParams) as ServiceRow[];

  return results.map((row) => ({
    ...row,
    platforms: row.platforms.split(","),
    details: JSON.parse(row.details),
  }));
}

export function getPlatforms(): string[] {
  const db = getDb();
  const sql = `SELECT DISTINCT platform FROM normalized_services ORDER BY platform`;
  const results = db.prepare(sql).all() as { platform: string }[];
  return results.map((r) => r.platform);
}

export function getCounts(params: SearchParams = {}): ApiCounts {
  const { query = "", platform = "all", searchMode = "full" } = params;

  const db = getDb();

  let whereClause = "1=1";
  const sqlParams: string[] = [];

  if (query) {
    const keywords = query.split(" ").filter((k) => k);
    keywords.forEach((keyword) => {
      if (searchMode === "title-only") {
        whereClause += ` AND title LIKE ?`;
        sqlParams.push(`%${keyword}%`);
      } else {
        whereClause += ` AND (title LIKE ? OR description LIKE ? OR tag LIKE ?)`;
        sqlParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
    });
  }

  if (platform && platform !== "all") {
    whereClause += ` AND platform = ?`;
    sqlParams.push(platform);
  }

  const countsSql = `
    SELECT
      COUNT(*) as view_all,
      SUM(CASE WHEN cnt = 8 THEN 1 ELSE 0 END) as all_platforms,
      SUM(CASE WHEN cnt >= 2 THEN 1 ELSE 0 END) as multiple,
      SUM(CASE WHEN cnt = 1 THEN 1 ELSE 0 END) as unique_only
    FROM (
      SELECT title, COUNT(DISTINCT platform) as cnt
      FROM normalized_services
      WHERE ${whereClause}
      GROUP BY title
    )
  `;

  const platformCountsSql = `
    SELECT platform, COUNT(DISTINCT title) as count
    FROM normalized_services
    WHERE ${whereClause}
    GROUP BY platform
  `;

  const categoryCounts = db
    .prepare(countsSql)
    .get(...sqlParams) as CategoryCounts;
  const platformCounts = db
    .prepare(platformCountsSql)
    .all(...sqlParams) as PlatformCount[];

  return {
    categories: categoryCounts,
    platforms: platformCounts,
  };
}
