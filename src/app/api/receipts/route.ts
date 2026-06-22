import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getReceipts } from "@/lib/db-queries";

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("run_id") ?? undefined;
  const receipts = getReceipts(db, runId);
  return NextResponse.json(receipts);
}
