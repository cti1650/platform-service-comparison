import { NextRequest, NextResponse } from "next/server";
import { searchServices } from "@/lib/services";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const services = searchServices({
    query: searchParams.get("query") || "",
    platform: searchParams.get("platform") || "all",
    category: searchParams.get("category") || "view-all",
    searchMode: searchParams.get("searchMode") || "full",
    limit: parseInt(searchParams.get("limit") || "2000"),
    offset: parseInt(searchParams.get("offset") || "0"),
  });

  return NextResponse.json({ services });
}
