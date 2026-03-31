"use client";

import type { ProcessedCounts } from "@/types";

interface PlatformFilterProps {
  selectedPlatform: string;
  setSelectedPlatform: (platform: string) => void;
  counts: ProcessedCounts;
  platforms: string[];
}

const platformConfig: Record<string, { icon: string; color: string }> = {
  zapier: { icon: "⚡", color: "#ff4a00" },
  ifttt: { icon: "🔗", color: "#000000" },
  powerAutomate: { icon: "🔄", color: "#0066ff" },
  n8n: { icon: "🛠️", color: "#ea4b71" },
  make: { icon: "🎯", color: "#6d4aff" },
  yoom: { icon: "💫", color: "#00c4cc" },
  dify: { icon: "🤖", color: "#1570ef" },
  anyflow: { icon: "🔌", color: "#10b981" },
};

export function PlatformFilter({
  selectedPlatform,
  setSelectedPlatform,
  counts,
  platforms,
}: PlatformFilterProps) {
  const sortedPlatforms = [...platforms].sort(
    (a, b) => (counts.platforms[b] || 0) - (counts.platforms[a] || 0)
  );

  return (
    <div className="filter-section p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
          プラットフォームフィルター
        </h3>
        <span className="text-xs text-gray-500">
          {counts.totalUniqueServices || 0} 件
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedPlatform("all")}
          className={`platform-chip ${selectedPlatform === "all" ? "active" : ""}`}
        >
          <span>🌐</span>
          <span>すべて</span>
        </button>
        {sortedPlatforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`platform-chip ${selectedPlatform === platform ? "active" : ""}`}
          >
            <span>{platformConfig[platform]?.icon || "📱"}</span>
            <span className="hidden sm:inline">{platform}</span>
            <span className="text-xs opacity-75">
              ({counts.platforms[platform] || 0})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
