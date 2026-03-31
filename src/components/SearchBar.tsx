"use client";

import { useRef } from "react";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchMode: string;
  onSearchModeChange: (value: string) => void;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  searchMode,
  onSearchModeChange,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onSearchChange("");
      inputRef.current?.blur();
    }
  };

  return (
    <div className="search-container p-1 sm:p-1.5">
      <div className="flex items-center">
        <div className="flex-shrink-0 pl-4 pr-2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={
            searchMode === "title-only"
              ? "サービス名で検索..."
              : "サービス名、説明文、タグで検索..."
          }
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="search-input flex-1 py-3 sm:py-4 px-2"
          autoComplete="off"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="flex-shrink-0 p-2 mr-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="searchMode"
              value="all"
              checked={searchMode === "all"}
              onChange={(e) => onSearchModeChange(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              全体検索
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="searchMode"
              value="title-only"
              checked={searchMode === "title-only"}
              onChange={(e) => onSearchModeChange(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              タイトルのみ
            </span>
          </label>
        </div>
        {searchQuery && (
          <span className="text-sm text-blue-600 font-medium">
            「{searchQuery}」で検索中
          </span>
        )}
      </div>
    </div>
  );
}
