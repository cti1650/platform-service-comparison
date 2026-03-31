"use client";

interface NoResultsProps {
  searchQuery: string;
}

export function NoResults({ searchQuery }: NoResultsProps) {
  return (
    <div className="col-span-full">
      <div className="no-results-container text-center py-16 px-8">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {searchQuery
            ? "検索条件に一致するサービスがありません"
            : "該当するサービスがありません"}
        </h3>
        <p className="text-sm text-gray-500">
          フィルター条件を変更してお試しください
        </p>
      </div>
    </div>
  );
}
