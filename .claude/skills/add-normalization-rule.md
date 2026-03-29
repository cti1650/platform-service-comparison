# add-normalization-rule

サービス名の正規化ルールを追加するスキル。

## トリガー条件
- 「〇〇と△△を同じサービスとして扱いたい」
- 「正規化ルールを追加して」
- 「サービス名を統一して」
- 「表記ゆれを修正して」

## 実行手順

### 1. 現在のルールを確認
```bash
sqlite3 public/services.db "SELECT pattern, normalized_name FROM normalization_rules ORDER BY normalized_name;"
```

### 2. 対象サービスの現状を確認
```bash
sqlite3 public/services.db "SELECT platform, title FROM raw_services WHERE title LIKE '%検索キーワード%';"
```

### 3. `scripts/db/init.ts` の `NORMALIZATION_RULES` 配列に追加
```typescript
{ pattern: "元の表記", normalized_name: "統一後の名前", priority: 10 },
```

#### priorityの指針
- `10`: 完全一致ルール（推奨）
- `5`: 部分一致や曖昧なルール

### 4. ルールを適用
```bash
npm run db:init
```

### 5. 適用結果を確認
```bash
sqlite3 public/services.db "SELECT title, original_title, platform FROM normalized_services WHERE original_title LIKE '%検索キーワード%';"
```

## 注意事項
- 既存ルールと重複する場合は `INSERT OR IGNORE` で自動スキップされる
- 全ルールをリセットする場合: `npm run db:init -- --reset`
- ルール追加後はブラウザをリロードして確認
