-- スクレイピング結果（生データ）
CREATE TABLE IF NOT EXISTS raw_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  description TEXT,
  tag TEXT,
  icon TEXT,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, title, link)
);

-- 正規化ルール
CREATE TABLE IF NOT EXISTS normalization_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL,
  is_regex INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- スクレイピング履歴
CREATE TABLE IF NOT EXISTS scrape_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  service_count INTEGER NOT NULL,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'success',
  error_message TEXT
);

-- 正規化済みサービスビュー
CREATE VIEW IF NOT EXISTS normalized_services AS
SELECT
  r.id,
  r.platform,
  COALESCE(
    (SELECT n.normalized_name
     FROM normalization_rules n
     WHERE (n.is_regex = 0 AND r.title = n.pattern)
        OR (n.is_regex = 1 AND r.title GLOB n.pattern)
     ORDER BY n.priority DESC
     LIMIT 1),
    r.title
  ) as title,
  r.title as original_title,
  r.link,
  r.description,
  r.tag,
  r.icon,
  r.scraped_at
FROM raw_services r;

-- グループ化済みサービスビュー（タイトルごとにプラットフォーム数を集計）
CREATE VIEW IF NOT EXISTS grouped_services AS
SELECT
  title,
  COUNT(DISTINCT platform) as platform_count,
  GROUP_CONCAT(DISTINCT platform) as platforms
FROM normalized_services
GROUP BY title;

-- カテゴリ別件数ビュー（プラットフォーム数を動的に取得）
CREATE VIEW IF NOT EXISTS category_counts AS
SELECT
  COUNT(*) as view_all,
  SUM(CASE WHEN platform_count = (SELECT COUNT(DISTINCT platform) FROM raw_services) THEN 1 ELSE 0 END) as all_platforms,
  SUM(CASE WHEN platform_count >= 2 THEN 1 ELSE 0 END) as multiple,
  SUM(CASE WHEN platform_count = 1 THEN 1 ELSE 0 END) as unique_only
FROM grouped_services;

-- プラットフォーム別件数ビュー
CREATE VIEW IF NOT EXISTS platform_counts AS
SELECT
  platform,
  COUNT(DISTINCT title) as service_count
FROM normalized_services
GROUP BY platform;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_raw_services_platform ON raw_services(platform);
CREATE INDEX IF NOT EXISTS idx_raw_services_title ON raw_services(title);
CREATE INDEX IF NOT EXISTS idx_normalization_rules_pattern ON normalization_rules(pattern);
CREATE INDEX IF NOT EXISTS idx_raw_services_platform_title ON raw_services(platform, title);
