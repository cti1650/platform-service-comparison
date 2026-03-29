import { BaseScraper } from "./base.js";
import type { ServiceData, PlatformName, ScrapeResult } from "./types.js";

interface GitHubTreeItem {
  path: string;
  type: "tree" | "blob";
  sha: string;
}

interface PluginManifest {
  name?: string;
  label?: { en_US?: string; ja_JP?: string };
  description?: { en_US?: string; ja_JP?: string };
  icon?: string;
  category?: string;
  type?: string;
}

export class DifyScraper extends BaseScraper {
  readonly platform: PlatformName = "dify";
  readonly url = "https://marketplace.dify.ai/plugins";

  private readonly GITHUB_API_URL =
    "https://api.github.com/repos/langgenius/dify-plugins/git/trees/main?recursive=1";

  async run(): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      platform: this.platform,
      services: [],
      scrapedAt: new Date(),
    };

    try {
      console.log("[dify] Fetching plugin list from GitHub API...");

      // GitHub APIからプラグインリストを取得
      const response = await fetch(this.GITHUB_API_URL);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = (await response.json()) as { tree: GitHubTreeItem[] };

      // author/plugin-name パターンのディレクトリを抽出
      const pluginPaths = data.tree
        .filter((item) => item.type === "tree")
        .map((item) => item.path)
        .filter((path) => {
          // author/plugin-name パターン（2階層のみ）
          const parts = path.split("/");
          return (
            parts.length === 2 &&
            !path.startsWith(".") &&
            !["node_modules", "examples", "docs"].includes(parts[0])
          );
        });

      console.log(`[dify] Found ${pluginPaths.length} plugins in repository`);

      // 各プラグインの情報を取得
      for (const pluginPath of pluginPaths) {
        const [author, pluginName] = pluginPath.split("/");

        // マニフェストファイルを取得してより詳細な情報を得る
        let manifest: PluginManifest | null = null;
        try {
          const manifestUrl = `https://raw.githubusercontent.com/langgenius/dify-plugins/main/${pluginPath}/manifest.yaml`;
          const manifestResponse = await fetch(manifestUrl);
          if (manifestResponse.ok) {
            const manifestText = await manifestResponse.text();
            manifest = this.parseYamlSimple(manifestText);
          }
        } catch {
          // manifest取得失敗は無視
        }

        // タイトルを決定
        const title =
          manifest?.label?.en_US ||
          manifest?.name ||
          pluginName.replace(/-/g, " ").replace(/_/g, " ");

        // 説明を決定
        const description = manifest?.description?.en_US || "";

        // カテゴリ/タグを決定
        const tag = manifest?.category || manifest?.type || "";

        const service: ServiceData = {
          title,
          link: `https://marketplace.dify.ai/plugin/${author}/${pluginName}`,
          description,
          tag,
          icon: manifest?.icon
            ? `https://raw.githubusercontent.com/langgenius/dify-plugins/main/${pluginPath}/${manifest.icon}`
            : "",
        };

        result.services.push(service);
      }

      console.log(`[dify] Processed ${result.services.length} plugins`);

      // DBに保存
      await this.saveToDatabase(result);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`[dify] Error: ${result.error}`);
    }

    return result;
  }

  // 簡易YAMLパーサー（manifest.yamlの基本情報のみ抽出）
  private parseYamlSimple(yaml: string): PluginManifest {
    const result: PluginManifest = {};
    const lines = yaml.split("\n");

    let inLabel = false;
    let inDescription = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      // トップレベルのキー
      if (!line.startsWith(" ") && !line.startsWith("\t")) {
        inLabel = false;
        inDescription = false;

        if (trimmed.startsWith("name:")) {
          result.name = trimmed.replace("name:", "").trim().replace(/['"]/g, "");
        } else if (trimmed.startsWith("icon:")) {
          result.icon = trimmed.replace("icon:", "").trim().replace(/['"]/g, "");
        } else if (trimmed.startsWith("category:")) {
          result.category = trimmed.replace("category:", "").trim().replace(/['"]/g, "");
        } else if (trimmed.startsWith("type:")) {
          result.type = trimmed.replace("type:", "").trim().replace(/['"]/g, "");
        } else if (trimmed === "label:") {
          inLabel = true;
          result.label = {};
        } else if (trimmed === "description:") {
          inDescription = true;
          result.description = {};
        }
      } else {
        // ネストされたキー
        if (inLabel && result.label) {
          if (trimmed.startsWith("en_US:")) {
            result.label.en_US = trimmed.replace("en_US:", "").trim().replace(/['"]/g, "");
          } else if (trimmed.startsWith("ja_JP:")) {
            result.label.ja_JP = trimmed.replace("ja_JP:", "").trim().replace(/['"]/g, "");
          }
        } else if (inDescription && result.description) {
          if (trimmed.startsWith("en_US:")) {
            result.description.en_US = trimmed.replace("en_US:", "").trim().replace(/['"]/g, "");
          } else if (trimmed.startsWith("ja_JP:")) {
            result.description.ja_JP = trimmed.replace("ja_JP:", "").trim().replace(/['"]/g, "");
          }
        }
      }
    }

    return result;
  }

  // Playwrightは使用しないがBaseScraperの抽象メソッドを実装
  async scrape(): Promise<ServiceData[]> {
    return [];
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new DifyScraper();
  scraper.run().then((result) => {
    console.log(`\nDify scrape completed: ${result.services.length} services`);
    if (result.error) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });
}
