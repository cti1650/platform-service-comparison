import { ServiceSearch } from "@/components/ServiceSearch";
import { searchServices, getCounts, getPlatforms } from "@/lib/services";

export default function Home() {
  // サーバーサイドで初期データを取得
  const initialServices = searchServices({
    query: "",
    platform: "all",
    category: "view-all",
    searchMode: "all",
    limit: 2000,
    offset: 0,
  });

  const initialCounts = getCounts({
    query: "",
    platform: "all",
    searchMode: "all",
  });

  const platforms = getPlatforms();

  return (
    <ServiceSearch
      initialServices={initialServices}
      initialCounts={initialCounts}
      platforms={platforms}
    />
  );
}
