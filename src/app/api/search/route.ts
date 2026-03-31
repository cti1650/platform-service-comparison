import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

interface ServiceRow {
  title: string;
  platforms: string;
  platform_count: number;
  details: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const platform = searchParams.get("platform") || "all";
  const category = searchParams.get("category") || "view-all";
  const searchMode = searchParams.get("searchMode") || "full";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

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
  const params: (string | number)[] = [];

  if (query) {
    const keywords = query.split(" ").filter((k) => k);
    keywords.forEach((keyword) => {
      if (searchMode === "title-only") {
        sql += ` AND title LIKE ?`;
        params.push(`%${keyword}%`);
      } else {
        sql += ` AND (title LIKE ? OR description LIKE ? OR tag LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
    });
  }

  if (platform && platform !== "all") {
    sql += ` AND platform = ?`;
    params.push(platform);
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
  params.push(limit, offset);

  const results = db.prepare(sql).all(...params) as ServiceRow[];

  const services = results.map((row) => ({
    ...row,
    platforms: row.platforms.split(","),
    details: JSON.parse(row.details),
  }));

  return NextResponse.json({ services });
}
