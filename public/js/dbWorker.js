/**
 * SQLite Database Worker
 * sql.js (WASM) を使用してブラウザ上でSQLiteをクエリ
 */

importScripts('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/sql-wasm.js');

let db = null;
let isInitializing = false;
let initPromise = null;
let TOTAL_PLATFORMS = 8; // DBから動的に取得される

/**
 * DB初期化
 */
async function initDb() {
  if (db) return db;
  if (isInitializing) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/${file}`
      });

      const response = await fetch('/services.db');
      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      db = new SQL.Database(new Uint8Array(buffer));

      // プラットフォーム数を動的に取得
      const stmt = db.prepare('SELECT COUNT(DISTINCT platform) as count FROM raw_services');
      if (stmt.step()) {
        TOTAL_PLATFORMS = stmt.getAsObject().count;
      }
      stmt.free();

      console.log('[dbWorker] Database initialized, platforms:', TOTAL_PLATFORMS);
      return db;
    } catch (error) {
      console.error('[dbWorker] Failed to initialize database:', error);
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * SQLクエリを実行してオブジェクト配列を返す
 */
function execQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }

  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}

/**
 * サービス検索（シンプル版）
 */
function searchServices({ query, platform, category, searchMode, limit = 2000, offset = 0 }) {
  // まず全サービスを正規化タイトルでグループ化して取得
  let sql = `
    SELECT
      title,
      platform,
      original_title,
      link,
      description,
      tag,
      icon
    FROM normalized_services
    WHERE 1=1
  `;

  const params = [];

  // プラットフォームフィルター
  if (platform && platform !== 'all') {
    sql += ` AND platform = ?`;
    params.push(platform);
  }

  // 検索条件
  if (query && query.trim()) {
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k);
    keywords.forEach(keyword => {
      const pattern = `%${keyword}%`;
      if (searchMode === 'title-only') {
        sql += ` AND LOWER(title) LIKE ?`;
        params.push(pattern);
      } else {
        sql += ` AND (LOWER(title) LIKE ? OR LOWER(original_title) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ? OR LOWER(COALESCE(tag, '')) LIKE ?)`;
        params.push(pattern, pattern, pattern, pattern);
      }
    });
  }

  sql += ` ORDER BY title`;

  const rows = execQuery(sql, params);

  // JavaScriptでグループ化
  const serviceMap = {};
  rows.forEach(row => {
    const title = row.title;
    if (!serviceMap[title]) {
      serviceMap[title] = {
        title,
        platforms: [],
        details: {}
      };
    }
    if (!serviceMap[title].platforms.includes(row.platform)) {
      serviceMap[title].platforms.push(row.platform);
      serviceMap[title].details[row.platform] = {
        title: row.original_title,
        link: row.link,
        description: row.description,
        tag: row.tag,
        icon: row.icon
      };
    }
  });

  // 配列に変換し、countフィールドを追加
  let services = Object.values(serviceMap).map(s => ({
    ...s,
    count: s.platforms.length
  }));

  // カテゴリフィルター
  if (category === 'all') {
    services = services.filter(s => s.platforms.length === TOTAL_PLATFORMS);
  } else if (category === 'multiple') {
    services = services.filter(s => s.platforms.length >= 2);
  } else if (category === 'unique') {
    services = services.filter(s => s.platforms.length === 1);
  }

  // プラットフォーム数でソート
  services.sort((a, b) => {
    if (b.platforms.length !== a.platforms.length) {
      return b.platforms.length - a.platforms.length;
    }
    return a.title.localeCompare(b.title);
  });

  // ページネーション
  return services.slice(offset, offset + limit);
}

/**
 * 件数取得
 */
function getCounts({ query, platform, category, searchMode }) {
  // 検索条件を適用した全サービスを取得
  let sql = `
    SELECT title, platform
    FROM normalized_services
    WHERE 1=1
  `;

  const params = [];

  // 検索条件
  if (query && query.trim()) {
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k);
    keywords.forEach(keyword => {
      const pattern = `%${keyword}%`;
      if (searchMode === 'title-only') {
        sql += ` AND LOWER(title) LIKE ?`;
        params.push(pattern);
      } else {
        sql += ` AND (LOWER(title) LIKE ? OR LOWER(original_title) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ? OR LOWER(COALESCE(tag, '')) LIKE ?)`;
        params.push(pattern, pattern, pattern, pattern);
      }
    });
  }

  const rows = execQuery(sql, params);

  // グループ化
  const serviceMap = {};
  rows.forEach(row => {
    if (!serviceMap[row.title]) {
      serviceMap[row.title] = new Set();
    }
    serviceMap[row.title].add(row.platform);
  });

  // カテゴリ別件数を計算（プラットフォームフィルター適用後）
  let filteredServices = Object.entries(serviceMap);
  if (platform && platform !== 'all') {
    filteredServices = filteredServices.filter(([_, platforms]) => platforms.has(platform));
  }

  const categoryCounts = {
    'view-all': filteredServices.length,
    'all': filteredServices.filter(([_, p]) => p.size === TOTAL_PLATFORMS).length,
    'multiple': filteredServices.filter(([_, p]) => p.size >= 2).length,
    'unique': filteredServices.filter(([_, p]) => p.size === 1).length
  };

  // プラットフォーム別件数（カテゴリフィルター適用後）
  let categoryFilteredServices = filteredServices;
  if (category === 'all') {
    categoryFilteredServices = filteredServices.filter(([_, p]) => p.size === TOTAL_PLATFORMS);
  } else if (category === 'multiple') {
    categoryFilteredServices = filteredServices.filter(([_, p]) => p.size >= 2);
  } else if (category === 'unique') {
    categoryFilteredServices = filteredServices.filter(([_, p]) => p.size === 1);
  }

  const platformCounts = {};
  categoryFilteredServices.forEach(([_, platforms]) => {
    platforms.forEach(p => {
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
  });

  return {
    ...categoryCounts,
    platforms: platformCounts,
    totalUniqueServices: categoryFilteredServices.length
  };
}

/**
 * 初期データ取得（全サービス数など）
 */
function getInitialData() {
  const rows = execQuery(`
    SELECT title, platform
    FROM normalized_services
  `);

  // ユニークなタイトル数
  const titles = new Set(rows.map(r => r.title));
  const totalServices = titles.size;

  // プラットフォーム別件数
  const platformCounts = {};
  rows.forEach(row => {
    platformCounts[row.platform] = (platformCounts[row.platform] || 0) + 1;
  });

  return {
    totalServices,
    platformCounts
  };
}

/**
 * メッセージハンドラ
 */
self.onmessage = async function(e) {
  const { type, payload, requestId } = e.data;

  try {
    await initDb();

    let result;
    switch (type) {
      case 'init':
        result = getInitialData();
        break;

      case 'search':
        const services = searchServices(payload || {});
        const counts = getCounts(payload || {});
        result = { services, counts };
        break;

      case 'counts':
        result = getCounts(payload || {});
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({ type, result, requestId, success: true });

  } catch (error) {
    console.error('[dbWorker] Error:', error);
    self.postMessage({
      type,
      error: error.message,
      requestId,
      success: false
    });
  }
};
