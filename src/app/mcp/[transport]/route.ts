import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import getDb from "@/lib/db";

const handler = createMcpHandler(
  (server) => {
    // サービス検索ツール
    server.registerTool(
      "search_services",
      {
        title: "Search iPaaS Services",
        description:
          "iPaaSプラットフォーム（Zapier, Make, n8n等）で利用可能なサービスを検索します。エイリアス対応（例: Googleスプレッドシート → Google Sheets）",
        inputSchema: z.object({
          query: z.string().describe("検索キーワード（例: Slack, Google Sheets）"),
          platform: z
            .string()
            .optional()
            .describe("特定のプラットフォームに絞る（例: zapier, make, n8n）"),
          limit: z.number().optional().default(20).describe("取得件数（デフォルト: 20）"),
        }),
      },
      async ({ query, platform, limit }) => {
        const db = getDb();
        const results = searchServicesForMcp(db, query, platform, limit ?? 20);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }
    );

    // 複数サービスに対応するプラットフォームを検索
    server.registerTool(
      "find_platforms_for_services",
      {
        title: "Find Platforms Supporting Multiple Services",
        description:
          "指定した複数のサービス全てに対応しているiPaaSプラットフォームを検索します。例: SlackとGoogle SheetsとNotionを連携したい場合",
        inputSchema: z.object({
          services: z
            .array(z.string())
            .describe("連携したいサービスのリスト（例: ['Slack', 'Google Sheets', 'Notion']）"),
        }),
      },
      async ({ services }) => {
        const db = getDb();
        const results = findPlatformsForServices(db, services);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }
    );

    // プラットフォーム一覧取得
    server.registerTool(
      "get_platforms",
      {
        title: "Get Available Platforms",
        description: "利用可能なiPaaSプラットフォームの一覧と各プラットフォームの対応サービス数を取得します",
        inputSchema: z.object({}),
      },
      async () => {
        const db = getDb();
        const platforms = db
          .prepare(
            `SELECT platform, COUNT(DISTINCT title) as service_count
             FROM normalized_services
             GROUP BY platform
             ORDER BY service_count DESC`
          )
          .all() as { platform: string; service_count: number }[];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(platforms, null, 2),
            },
          ],
        };
      }
    );

    // サービス詳細取得
    server.registerTool(
      "get_service_detail",
      {
        title: "Get Service Detail",
        description: "特定のサービスの詳細情報（対応プラットフォーム、リンク等）を取得します",
        inputSchema: z.object({
          serviceName: z.string().describe("サービス名（例: Slack, Google Sheets）"),
        }),
      },
      async ({ serviceName }) => {
        const db = getDb();
        const results = getServiceDetail(db, serviceName);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }
    );
  },
  {
    capabilities: {},
  },
  {
    basePath: "/mcp",
    verboseLogs: true,
  }
);

// エイリアス経由で正規名を取得
function getCanonicalNamesForKeyword(
  db: ReturnType<typeof getDb>,
  keyword: string
): string[] {
  const sql = `
    SELECT DISTINCT name FROM (
      SELECT normalized_name as name FROM normalization_rules WHERE pattern LIKE ?
      UNION
      SELECT canonical_name as name FROM search_aliases WHERE alias LIKE ?
    )
  `;
  const results = db.prepare(sql).all(`%${keyword}%`, `%${keyword}%`) as {
    name: string;
  }[];
  return results.map((r) => r.name);
}

// MCP用サービス検索
function searchServicesForMcp(
  db: ReturnType<typeof getDb>,
  query: string,
  platform: string | undefined,
  limit: number
) {
  const canonicalNames = getCanonicalNamesForKeyword(db, query);

  let sql = `
    SELECT
      title,
      GROUP_CONCAT(DISTINCT platform) as platforms,
      COUNT(DISTINCT platform) as platform_count
    FROM normalized_services
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (canonicalNames.length > 0) {
    const placeholders = canonicalNames.map(() => "title = ?").join(" OR ");
    sql += ` AND (title LIKE ? OR ${placeholders})`;
    params.push(`%${query}%`, ...canonicalNames);
  } else {
    sql += ` AND title LIKE ?`;
    params.push(`%${query}%`);
  }

  if (platform) {
    sql += ` AND platform = ?`;
    params.push(platform);
  }

  sql += ` GROUP BY title ORDER BY platform_count DESC LIMIT ?`;
  params.push(limit);

  const results = db.prepare(sql).all(...params) as {
    title: string;
    platforms: string;
    platform_count: number;
  }[];

  return results.map((r) => ({
    ...r,
    platforms: r.platforms.split(","),
  }));
}

// 複数サービスに対応するプラットフォームを検索
function findPlatformsForServices(
  db: ReturnType<typeof getDb>,
  services: string[]
) {
  // 各サービスの正規名を取得
  const normalizedServices = services.flatMap((service) => {
    const canonical = getCanonicalNamesForKeyword(db, service);
    return canonical.length > 0 ? canonical : [service];
  });

  // 重複除去
  const uniqueServices = [...new Set(normalizedServices)];

  // 各プラットフォームごとに、指定サービスのうち何個対応しているかをカウント
  const sql = `
    SELECT
      platform,
      COUNT(DISTINCT title) as matched_count,
      GROUP_CONCAT(DISTINCT title) as matched_services
    FROM normalized_services
    WHERE title IN (${uniqueServices.map(() => "?").join(",")})
    GROUP BY platform
    HAVING matched_count = ?
    ORDER BY matched_count DESC
  `;

  const results = db.prepare(sql).all(...uniqueServices, uniqueServices.length) as {
    platform: string;
    matched_count: number;
    matched_services: string;
  }[];

  return {
    requested_services: services,
    normalized_services: uniqueServices,
    platforms_supporting_all: results.map((r) => ({
      platform: r.platform,
      matched_services: r.matched_services.split(","),
    })),
    total_platforms_found: results.length,
  };
}

// サービス詳細取得
function getServiceDetail(db: ReturnType<typeof getDb>, serviceName: string) {
  const canonical = getCanonicalNamesForKeyword(db, serviceName);
  const searchName = canonical.length > 0 ? canonical[0] : serviceName;

  const sql = `
    SELECT
      title,
      platform,
      original_title,
      link,
      description
    FROM normalized_services
    WHERE title = ? OR title LIKE ?
    ORDER BY platform
  `;

  const results = db.prepare(sql).all(searchName, `%${serviceName}%`) as {
    title: string;
    platform: string;
    original_title: string;
    link: string;
    description: string;
  }[];

  if (results.length === 0) {
    return { found: false, service: serviceName };
  }

  const grouped = results.reduce(
    (acc, r) => {
      if (!acc.platforms[r.platform]) {
        acc.platforms[r.platform] = {
          original_title: r.original_title,
          link: r.link,
          description: r.description,
        };
      }
      return acc;
    },
    {
      title: results[0].title,
      platform_count: new Set(results.map((r) => r.platform)).size,
      platforms: {} as Record<
        string,
        { original_title: string; link: string; description: string }
      >,
    }
  );

  return { found: true, ...grouped };
}

export { handler as GET, handler as POST };
