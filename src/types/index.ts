export interface ServiceDetail {
  original_title?: string;
  title?: string;
  link?: string;
  description?: string;
  tag?: string;
  icon?: string;
}

export interface Service {
  title: string;
  platforms: string[];
  platform_count: number;
  details: Record<string, ServiceDetail>;
}

export interface CategoryCounts {
  view_all: number;
  all_platforms: number;
  multiple: number;
  unique_only: number;
}

export interface PlatformCount {
  platform: string;
  count: number;
}

export interface ApiCounts {
  categories: CategoryCounts;
  platforms: PlatformCount[];
}

// フロントエンド用の加工済みカウント
export interface ProcessedCounts {
  "view-all": number;
  all: number;
  multiple: number;
  unique: number;
  platforms: Record<string, number>;
  totalUniqueServices: number;
}
