import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getReceipts } from "@/lib/db-queries";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const receipts = getReceipts(db, params.id);
  return NextResponse.json(receipts);
}
