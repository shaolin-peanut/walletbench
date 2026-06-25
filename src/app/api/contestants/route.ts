import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getContestants } from "@/lib/db-queries";

export async function GET() {
  const db = getDb();
  const contestants = getContestants(db);
  return NextResponse.json(contestants);
}
