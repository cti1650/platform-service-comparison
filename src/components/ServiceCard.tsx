"use client";

import { useState } from "react";

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

interface ServiceCardProps {
  service: Service;
}

function PlatformBadge({
  platform,
  service,
}: {
  platform: string;
  service: Service;
}) {
  const handleClick = () => {
    const link = service.details[platform]?.link;
    if (link) window.open(link, "_blank");
  };

  const platformClass = platform.toLowerCase().replace(/\s+/g, "");

  return (
    <span
      className={`platform-badge ${platformClass}`}
      onClick={handleClick}
      title={service.details[platform]?.link ? `${platform}で開く` : platform}
    >
      {platform}
    </span>
  );
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstPlatform = service.details[service.platforms[0]];
  const imgUrl = firstPlatform?.icon;

  const handleGoogleSearch = () => {
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(service.title)}`,
      "_blank"
    );
  };

  return (
    <div className="service-card animate-fade-in">
      <div className="p-4 sm:p-6">
        {/* ヘッダー */}
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          {imgUrl && (
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-gray-50 p-1.5 border border-gray-100">
              <img
                src={imgUrl}
                alt=""
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {service.title}
              </h3>
              <button
                onClick={handleGoogleSearch}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="Google検索"
              >
                <svg
                  className="w-4 h-4"
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
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                {service.platform_count} プラットフォーム
              </span>
            </div>
          </div>
        </div>

        {/* プラットフォームバッジ */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {service.platforms.map((platform) => (
            <PlatformBadge key={platform} platform={platform} service={service} />
          ))}
        </div>

        {/* 詳細トグル */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
        >
          <span>{isExpanded ? "詳細を閉じる" : "詳細を見る"}</span>
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* 詳細パネル */}
        {isExpanded && (
          <div className="mt-4 space-y-3 animate-slide-up">
            {service.platforms.map((platform) => (
              <div
                key={platform}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800 text-sm">
                    {platform}
                  </h4>
                  {service.details[platform]?.link && (
                    <a
                      href={service.details[platform].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>
                {service.details[platform]?.original_title &&
                  service.details[platform].original_title !== service.title && (
                    <p className="text-xs text-gray-500 mb-2">
                      別名: {service.details[platform].original_title}
                    </p>
                  )}
                {service.details[platform]?.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {service.details[platform].description}
                  </p>
                )}
                {service.details[platform]?.tag && (
                  <span className="inline-block mt-2 px-2 py-1 bg-white text-gray-600 text-xs rounded-full border border-gray-200">
                    🏷️ {service.details[platform].tag}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
