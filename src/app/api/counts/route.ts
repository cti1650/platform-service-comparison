import { NextRequest, NextResponse } from "next/server";
import { getCounts } from "@/lib/services";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const counts = getCounts({
    query: searchParams.get("query") || "",
    platform: searchParams.get("platform") || "all",
    searchMode: searchParams.get("searchMode") || "full",
  });

  return NextResponse.json(counts);
}
