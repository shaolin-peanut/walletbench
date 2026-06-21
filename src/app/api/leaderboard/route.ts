import { NextResponse } from "next/server";
import { fixtures } from "@/lib/fixtures";

export async function GET() {
  // TODO: replace with DB query after E5/E6
  return NextResponse.json(fixtures.leaderboard);
}
