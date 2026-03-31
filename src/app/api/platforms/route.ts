import { NextResponse } from "next/server";
import getDb from "@/lib/db";

interface PlatformRow {
  platform: string;
}

export async function GET() {
  const db = getDb();

  const sql = `SELECT DISTINCT platform FROM raw_services ORDER BY platform`;
  const platforms = db.prepare(sql).all() as PlatformRow[];

  return NextResponse.json({
    platforms: platforms.map((p) => p.platform),
  });
}
