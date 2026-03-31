---
name: add-normalization-rule
description: |
  サービス名の正規化ルールを追加するスキル。表記ゆれの統一に使用。
  トリガー条件: (1) 〇〇と△△を同じサービスとして扱いたい (2) 正規化ルールを追加して (3) サービス名を統一して (4) 表記ゆれを修正して
---

# サービス名正規化ルール追加

## 実行手順

### 1. 現在のルールと対象サービスを確認
```bash
sqlite3 public/services.db "SELECT pattern, normalized_name FROM normalization_rules ORDER BY normalized_name;"
sqlite3 public/services.db "SELECT platform, title FROM raw_services WHERE title LIKE '%検索キーワード%';"
```

### 2. `scripts/db/init.ts` の `NORMALIZATION_RULES` 配列に追加
```typescript
{ pattern: "元の表記", normalized_name: "統一後の名前", priority: 10 },
```

**priority指針**: `10`=完全一致（推奨）、`5`=部分一致

### 3. ルール適用と確認
```bash
npm run db:init
sqlite3 public/services.db "SELECT title, original_title, platform FROM normalized_services WHERE original_title LIKE '%検索キーワード%';"
```

## 注意事項
- 重複ルールは`INSERT OR IGNORE`で自動スキップ
- 全リセット: `npm run db:init -- --reset`
