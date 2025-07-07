/**
 * Service Name Normalizer
 * サービス名の表記揺れを統一するための設定ファイル
 */

// サービス名の正規化ルール
const SERVICE_NAME_RULES = {
  // 完全一致による置換（大文字小文字を区別しない）
  exactMatch: {
    // X/Twitter 関連
    'Twitter': 'X (formerly Twitter)',
    'X (formerly Twitter)': 'X (formerly Twitter)',
    'X (Formerly Twitter)': 'X (formerly Twitter)',
    'X（Twitter）': 'X (formerly Twitter)',
    'AI Twitter Assistant': 'X (formerly Twitter) AI Assistant',
    
    // Microsoft Office Suite
    'Office 365 Outlook': 'Microsoft Outlook',
    'Outlook.com': 'Microsoft Outlook',
    'Microsoft 365 Email (Outlook)': 'Microsoft Outlook',
    'MS Teams': 'Microsoft Teams',
    'Teams': 'Microsoft Teams',
    'Microsoft 365 Excel': 'Microsoft Excel',
    'Excel Online (Business)': 'Microsoft Excel',
    'Excel Online (OneDrive)': 'Microsoft Excel',
    'Microsoft Excel 365': 'Microsoft Excel',
    'SharePoint': 'Microsoft SharePoint',
    'Microsoft SharePoint Online': 'Microsoft SharePoint',
    'OneNote (Business)': 'Microsoft OneNote',
    'OneNote Consumer': 'Microsoft OneNote',
    'Word Online (Business)': 'Microsoft Word',
    'Microsoft Word Templates': 'Microsoft Word',
    
    // Google Services (Japanese to English)
    'Google スプレッドシート': 'Google Sheets',
    'Googleドキュメント': 'Google Docs',
    'Googleカレンダー': 'Google Calendar',
    'Googleフォーム': 'Google Forms',
    'Googleコンタクト': 'Google Contacts',
    'Google アナリティクス': 'Google Analytics',
    'Googleビジネスプロフィール': 'Google Business Profile',
    'Google My Business': 'Google Business Profile',
    'Google Drive™': 'Google Drive',
    'BigQuery': 'Google BigQuery',
    'Google BigQuery - Dev': 'Google BigQuery',
    'google_sheets': 'Google Sheets',
    'google_drive': 'Google Drive',
    
    // Social Media
    'Instagram for Business': 'Instagram',
    'Facebook Pages': 'Facebook',
    'Meta広告（Facebook）': 'Facebook Ads',
    'LinkedIn Ads': 'LinkedIn',
    'LinkedIn Conversions': 'LinkedIn',
    
    // Other common variations
    'Wordpress': 'WordPress',
    'Webex by Cisco': 'Cisco Webex',
    'Webex Meetings': 'Cisco Webex',
    'Cisco Webex Meetings': 'Cisco Webex',
    'Webex by Cisco Trigger': 'Cisco Webex',
    'Microsoft 365 Calendar': 'Microsoft Calendar',
    'Microsoft 365 People': 'Microsoft People',
    'Microsoft 365 Planner': 'Microsoft Planner',
    'M365 Search': 'Microsoft 365 Search',
    'Microsoft 365 compliance': 'Microsoft 365 Compliance',
    
    // Kintone (already handled in code but added for completeness)
    'kintone': 'Kintone',

    'Webhook': 'Webhooks',
    'Webhooks by Zapier': 'Webhooks',
  },
  
  // 正規表現による置換
  patterns: [
    // (Independent Publisher) サフィックスを削除
    {
      pattern: /^(.+)\s+\(Independent Publisher\)$/i,
      replacement: '$1'
    },
    
    // [DEPRECATED] サフィックスを削除
    {
      pattern: /^(.+)\s+\[DEPRECATED\]$/i,
      replacement: '$1 (Deprecated)'
    },
    
    // Microsoft 365 プレフィックスを統一
    {
      pattern: /^Office 365\s+(.+)$/i,
      replacement: 'Microsoft 365 $1'
    },
    
    // Google services - 重複する "Google" を削除
    {
      pattern: /^Google\s+Google\s+(.+)$/i,
      replacement: 'Google $1'
    },
    
    // Microsoft プレフィックスの統一
    {
      pattern: /^MS\s+(.+)$/i,
      replacement: 'Microsoft $1'
    },
    
    // Webex の統一
    {
      pattern: /^Webex\s+(.+)$/i,
      replacement: 'Cisco Webex $1'
    }
  ]
};

/**
 * サービス名を正規化する
 * @param {string} serviceName - 正規化前のサービス名
 * @returns {string} 正規化後のサービス名
 */
function normalizeServiceName(serviceName) {
  if (!serviceName || typeof serviceName !== 'string') {
    return serviceName;
  }
  
  let normalizedName = serviceName.trim();
  
  // 1. 完全一致による置換
  const exactMatchKey = Object.keys(SERVICE_NAME_RULES.exactMatch)
    .find(key => key.toLowerCase() === normalizedName.toLowerCase());
  
  if (exactMatchKey) {
    return SERVICE_NAME_RULES.exactMatch[exactMatchKey];
  }
  
  // 2. 正規表現による置換
  for (const rule of SERVICE_NAME_RULES.patterns) {
    if (rule.pattern.test(normalizedName)) {
      normalizedName = normalizedName.replace(rule.pattern, rule.replacement);
      break; // 最初にマッチしたルールのみ適用
    }
  }
  
  return normalizedName;
}

/**
 * サービス名の正規化を一括で適用する
 * @param {Array} services - サービス配列
 * @returns {Array} 正規化されたサービス配列
 */
function normalizeServiceNames(services) {
  if (!Array.isArray(services)) {
    return services;
  }
  
  return services.map(service => ({
    ...service,
    title: normalizeServiceName(service.title)
  }));
}

/**
 * 正規化ルールを取得する（デバッグ用）
 * @returns {Object} 正規化ルール
 */
function getNormalizationRules() {
  return SERVICE_NAME_RULES;
}

/**
 * 正規化の統計情報を取得する
 * @param {Array} services - 元のサービス配列
 * @returns {Object} 統計情報
 */
function getNormalizationStats(services) {
  if (!Array.isArray(services)) {
    return { total: 0, normalized: 0, rules: [] };
  }
  
  const stats = {
    total: services.length,
    normalized: 0,
    rules: []
  };
  
  services.forEach(service => {
    const original = service.title;
    const normalized = normalizeServiceName(original);
    
    if (original !== normalized) {
      stats.normalized++;
      stats.rules.push({
        original,
        normalized,
        rule: findAppliedRule(original)
      });
    }
  });
  
  return stats;
}

/**
 * 適用されたルールを特定する（デバッグ用）
 * @param {string} serviceName - サービス名
 * @returns {string} 適用されたルール名
 */
function findAppliedRule(serviceName) {
  const exactMatchKey = Object.keys(SERVICE_NAME_RULES.exactMatch)
    .find(key => key.toLowerCase() === serviceName.toLowerCase());
  
  if (exactMatchKey) {
    return `exactMatch: ${exactMatchKey}`;
  }
  
  for (let i = 0; i < SERVICE_NAME_RULES.patterns.length; i++) {
    const rule = SERVICE_NAME_RULES.patterns[i];
    if (rule.pattern.test(serviceName)) {
      return `pattern[${i}]: ${rule.pattern.toString()}`;
    }
  }
  
  return 'none';
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.ServiceNameNormalizer = {
    normalizeServiceName,
    normalizeServiceNames,
    getNormalizationRules,
    getNormalizationStats,
    findAppliedRule
  };
}

// Node.js環境での使用をサポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeServiceName,
    normalizeServiceNames,
    getNormalizationRules,
    getNormalizationStats,
    findAppliedRule
  };
}