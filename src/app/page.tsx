"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PlatformFilter } from "@/components/PlatformFilter";
import { ServiceCard } from "@/components/ServiceCard";
import { ScrollTopButton } from "@/components/ScrollTopButton";
import { NoResults } from "@/components/NoResults";

const PLATFORMS = [
  "zapier",
  "ifttt",
  "powerAutomate",
  "n8n",
  "make",
  "yoom",
  "dify",
  "anyflow",
];

interface ServiceDetail {
  original_title?: string;
  title?: string;
  link?: string;
  description?: string;
  tag?: string;
  icon?: string;
}

interface Service {
  title: string;
  platforms: string[];
  platform_count: number;
  details: Record<string, ServiceDetail>;
}

interface CategoryCounts {
  view_all: number;
  all_platforms: number;
  multiple: number;
  unique_only: number;
}

interface PlatformCount {
  platform: string;
  count: number;
}

interface Counts {
  categories: CategoryCounts;
  platforms: PlatformCount[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("view-all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchMode, setSearchMode] = useState("all");
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalServices, setTotalServices] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{
    "view-all": number;
    all: number;
    multiple: number;
    unique: number;
    platforms: Record<string, number>;
    totalUniqueServices: number;
  }>({
    "view-all": 0,
    all: 0,
    multiple: 0,
    unique: 0,
    platforms: {},
    totalUniqueServices: 0,
  });

  const debouncedSearchQuery = useDebounce(searchInput, 300);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query: debouncedSearchQuery,
        platform: selectedPlatform,
        category: selectedCategory,
        searchMode: searchMode,
        limit: "2000",
        offset: "0",
      });

      const [searchRes, countsRes] = await Promise.all([
        fetch(`/api/search?${params}`),
        fetch(`/api/counts?${params}`),
      ]);

      if (!searchRes.ok || !countsRes.ok) {
        throw new Error("APIエラーが発生しました");
      }

      const searchData = await searchRes.json();
      const countsData: Counts = await countsRes.json();

      setServices(searchData.services);

      // 件数データの変換
      const platformsMap: Record<string, number> = {};
      countsData.platforms.forEach((p) => {
        platformsMap[p.platform] = p.count;
      });

      setCounts({
        "view-all": countsData.categories.view_all || 0,
        all: countsData.categories.all_platforms || 0,
        multiple: countsData.categories.multiple || 0,
        unique: countsData.categories.unique_only || 0,
        platforms: platformsMap,
        totalUniqueServices: countsData.categories.view_all || 0,
      });

      if (totalServices === 0) {
        setTotalServices(countsData.categories.view_all || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearchQuery,
    selectedPlatform,
    selectedCategory,
    searchMode,
    totalServices,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">エラー</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" translate="no">
      <Header totalServices={totalServices} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10 pb-12">
        {/* 検索セクション */}
        <div className="mb-6">
          <SearchBar
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            searchMode={searchMode}
            onSearchModeChange={setSearchMode}
          />
        </div>

        {/* フィルターセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            counts={counts}
          />
          <PlatformFilter
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            counts={counts}
            platforms={PLATFORMS}
          />
        </div>

        {/* 結果ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {isLoading && <div className="loading-spinner"></div>}
            <span className="text-sm text-gray-600">
              {isLoading
                ? "検索中..."
                : `${services.length.toLocaleString()} 件のサービス`}
            </span>
          </div>
          {services.length >= 2000 && (
            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              ※ 表示は2,000件まで
            </span>
          )}
        </div>

        {/* サービスグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {services.length > 0 ? (
            services.map((service) => (
              <ServiceCard key={service.title} service={service} />
            ))
          ) : (
            !isLoading && <NoResults searchQuery={debouncedSearchQuery} />
          )}
        </div>
      </main>

      <ScrollTopButton />

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>iPaaS連携サービス比較ツール</p>
          <p className="mt-1 text-gray-500">
            Zapier, IFTTT, Make, Power Automate, n8n, Yoom, Dify, Anyflow
          </p>
        </div>
      </footer>
    </div>
  );
}
