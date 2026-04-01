---
name: mcp-server
description: |
  MCPサーバーの使用方法とツール追加手順を説明するスキル。
  トリガー条件: (1) MCPサーバーについて教えて (2) MCPツールを追加したい (3) AIからサービス検索したい
---

# MCP サーバー

## 概要

AIツール（Claude Desktop等）からiPaaS連携サービスを検索できるMCPサーバー。
[mcp-handler](https://github.com/vercel/mcp-handler)を使用してNext.js内で動作。

## エンドポイント

- 開発: `http://localhost:3000/mcp/mcp`
- 本番: `https://<domain>/mcp/mcp`

## 利用可能なツール

| ツール名 | 説明 |
|---------|------|
| `search_services` | サービス名で検索（エイリアス対応） |
| `find_platforms_for_services` | 複数サービス全対応のプラットフォームを検索 |
| `get_platforms` | プラットフォーム一覧と対応サービス数 |
| `get_service_detail` | サービス詳細（各プラットフォームのリンク等） |

## 動作確認

```bash
# ツール一覧取得
curl -X POST http://localhost:3000/mcp/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# find_platforms_for_services呼び出し
curl -X POST http://localhost:3000/mcp/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"find_platforms_for_services","arguments":{"services":["Slack","Google Sheets","Notion"]}}}'
```

## ツール追加手順

`src/app/mcp/[transport]/route.ts` に追加:

```typescript
server.registerTool(
  "tool_name",
  {
    title: "ツール名",
    description: "説明",
    inputSchema: z.object({
      param: z.string().describe("パラメータの説明"),
    }),
  },
  async ({ param }) => {
    // 処理
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);
```

## Claude Desktopでの設定

`~/.config/claude/config.json` または `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ipaas-comparison": {
      "url": "http://localhost:3000/mcp/mcp"
    }
  }
}
```
