import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getScores } from "@/lib/db-queries";

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get("challenge_id") ?? undefined;
  const scores = getScores(db, challengeId);
  return NextResponse.json(scores);
}
