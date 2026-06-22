import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getChallengeById } from "@/lib/db-queries";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const challenge = getChallengeById(db, params.id);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }
  return NextResponse.json(challenge);
}
