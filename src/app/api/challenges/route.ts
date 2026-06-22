import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getChallenges } from "@/lib/db-queries";

export async function GET() {
  const db = getDb();
  const challenges = getChallenges(db);
  return NextResponse.json(challenges);
}
