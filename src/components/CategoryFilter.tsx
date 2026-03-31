"use client";

interface Counts {
  "view-all": number;
  all: number;
  multiple: number;
  unique: number;
  [key: string]: number;
}

interface CategoryFilterProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  counts: Counts;
}

export function CategoryFilter({
  selectedCategory,
  setSelectedCategory,
  counts,
}: CategoryFilterProps) {
  const categories = [
    {
      key: "view-all",
      label: "すべて",
      icon: "📋",
      description: "すべてのサービス",
    },
    {
      key: "all",
      label: "全共通",
      icon: "🎯",
      description: "8プラットフォーム共通",
    },
    {
      key: "multiple",
      label: "複数",
      icon: "🔗",
      description: "2プラットフォーム以上",
    },
    {
      key: "unique",
      label: "ユニーク",
      icon: "💎",
      description: "1プラットフォーム限定",
    },
  ];

  return (
    <div className="filter-section p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
          カテゴリーフィルター
        </h3>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`filter-chip ${selectedCategory === cat.key ? "active" : ""}`}
            title={cat.description}
          >
            <span>{cat.icon}</span>
            <span className="hidden sm:inline">{cat.label}</span>
            <span className="count">{counts[cat.key] || 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
