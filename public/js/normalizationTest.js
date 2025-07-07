/**
 * サービス名正規化のテスト・デバッグ用スクリプト
 */

// テスト用のサンプルサービス名
const testServiceNames = [
  // X/Twitter 関連
  'Twitter',
  'X (formerly Twitter)',
  'X (Formerly Twitter)',
  'X（Twitter）',
  'AI Twitter Assistant',
  
  // Microsoft Office Suite
  'Office 365 Outlook',
  'Outlook.com',
  'Microsoft 365 Email (Outlook)',
  'MS Teams',
  'Teams',
  'Microsoft 365 Excel',
  'Excel Online (Business)',
  'Excel Online (OneDrive)',
  'Microsoft Excel 365',
  'SharePoint',
  'Microsoft SharePoint Online',
  'OneNote (Business)',
  'OneNote Consumer',
  'Word Online (Business)',
  'Microsoft Word Templates',
  
  // Google Services (Japanese to English)
  'Google スプレッドシート',
  'Googleドキュメント',
  'Googleカレンダー',
  'Googleフォーム',
  'Googleコンタクト',
  'Google アナリティクス',
  'Googleビジネスプロフィール',
  'Google My Business',
  'Google Drive™',
  
  // Independent Publisher
  '1pt (Independent Publisher)',
  'AccuWeather (Independent Publisher)',
  'Airtable (Independent Publisher)',
  
  // Deprecated
  'Excel [DEPRECATED]',
  'Outlook Tasks [DEPRECATED]',
  'Airtable (Independent Publisher) [DEPRECATED]',
  
  // その他
  'Wordpress',
  'Webex by Cisco',
  'Webex Meetings',
  'Cisco Webex Meetings',
  'kintone',
  'Instagram for Business',
  'Facebook Pages',
  'Meta広告（Facebook）',
  'LinkedIn Ads'
];

/**
 * 正規化テストを実行
 */
function runNormalizationTest() {
  console.log('=== サービス名正規化テスト ===\n');
  
  const results = [];
  
  testServiceNames.forEach(serviceName => {
    const normalized = window.ServiceNameNormalizer.normalizeServiceName(serviceName);
    const rule = window.ServiceNameNormalizer.findAppliedRule(serviceName);
    
    const result = {
      original: serviceName,
      normalized: normalized,
      changed: serviceName !== normalized,
      rule: rule
    };
    
    results.push(result);
    
    if (result.changed) {
      console.log(`✅ ${serviceName} → ${normalized}`);
      console.log(`   ルール: ${rule}\n`);
    } else {
      console.log(`⚪ ${serviceName} (変更なし)\n`);
    }
  });
  
  // 統計情報を表示
  const changedCount = results.filter(r => r.changed).length;
  const totalCount = results.length;
  
  console.log(`\n=== 統計情報 ===`);
  console.log(`総サービス数: ${totalCount}`);
  console.log(`正規化されたサービス数: ${changedCount}`);
  console.log(`正規化率: ${((changedCount / totalCount) * 100).toFixed(1)}%`);
  
  // ルール別の統計
  const ruleStats = {};
  results.forEach(result => {
    if (result.changed) {
      const ruleKey = result.rule.split(':')[0];
      ruleStats[ruleKey] = (ruleStats[ruleKey] || 0) + 1;
    }
  });
  
  console.log(`\n=== ルール別統計 ===`);
  Object.entries(ruleStats).forEach(([rule, count]) => {
    console.log(`${rule}: ${count}件`);
  });
  
  return results;
}

/**
 * 正規化ルールを表示
 */
function showNormalizationRules() {
  console.log('=== 正規化ルール一覧 ===\n');
  
  const rules = window.ServiceNameNormalizer.getNormalizationRules();
  
  console.log('【完全一致ルール】');
  Object.entries(rules.exactMatch).forEach(([key, value]) => {
    console.log(`"${key}" → "${value}"`);
  });
  
  console.log('\n【正規表現ルール】');
  rules.patterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.pattern.toString()} → "${pattern.replacement}"`);
  });
}

/**
 * 実際のプラットフォームデータで正規化統計を取得
 */
function getActualPlatformStats() {
  console.log('=== 実際のプラットフォームデータ統計 ===\n');
  
  // 各プラットフォームのデータを取得
  const platforms = {
    zapier: zapierServices,
    ifttt: iftttServices,
    powerAutomate: powerAutomateServices,
    n8n: n8nServices,
    make: makeServices,
    yoom: yoomServices
  };
  
  Object.entries(platforms).forEach(([platformName, services]) => {
    if (services && Array.isArray(services)) {
      const stats = window.ServiceNameNormalizer.getNormalizationStats(services);
      console.log(`${platformName}:`);
      console.log(`  総サービス数: ${stats.total}`);
      console.log(`  正規化されたサービス数: ${stats.normalized}`);
      console.log(`  正規化率: ${((stats.normalized / stats.total) * 100).toFixed(1)}%`);
      
      if (stats.rules.length > 0) {
        console.log(`  正規化例（最初の5件）:`);
        stats.rules.slice(0, 5).forEach(rule => {
          console.log(`    "${rule.original}" → "${rule.normalized}"`);
        });
      }
      console.log('');
    }
  });
}

// ページ読み込み後にテストを実行
if (typeof window !== 'undefined') {
  window.NormalizationTest = {
    runNormalizationTest,
    showNormalizationRules,
    getActualPlatformStats
  };
  
  // 開発者コンソールでの使用例をログ出力
  console.log(`
=== サービス名正規化テストの使用方法 ===

1. 基本テスト実行:
   NormalizationTest.runNormalizationTest()

2. ルール一覧表示:
   NormalizationTest.showNormalizationRules()

3. 実際のプラットフォームデータ統計:
   NormalizationTest.getActualPlatformStats()

4. 個別のサービス名正規化:
   ServiceNameNormalizer.normalizeServiceName('Twitter')
   ServiceNameNormalizer.normalizeServiceName('Office 365 Outlook')

5. 正規化統計の取得:
   ServiceNameNormalizer.getNormalizationStats(zapierServices)
  `);
}