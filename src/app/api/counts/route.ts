import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

interface CategoryCounts {
  view_all: number;
  all_platforms: number;
  multiple: number;
  unique_only: number;
}

interface PlatformCount {
  platform: string;
  count: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const platform = searchParams.get("platform") || "all";
  const searchMode = searchParams.get("searchMode") || "full";

  const db = getDb();

  let whereClause = "1=1";
  const params: string[] = [];

  if (query) {
    const keywords = query.split(" ").filter((k) => k);
    keywords.forEach((keyword) => {
      if (searchMode === "title-only") {
        whereClause += ` AND title LIKE ?`;
        params.push(`%${keyword}%`);
      } else {
        whereClause += ` AND (title LIKE ? OR description LIKE ? OR tag LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
    });
  }

  if (platform && platform !== "all") {
    whereClause += ` AND platform = ?`;
    params.push(platform);
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

  const categoryCounts = db.prepare(countsSql).get(...params) as CategoryCounts;
  const platformCounts = db
    .prepare(platformCountsSql)
    .all(...params) as PlatformCount[];

  return NextResponse.json({
    categories: categoryCounts,
    platforms: platformCounts,
  });
}
