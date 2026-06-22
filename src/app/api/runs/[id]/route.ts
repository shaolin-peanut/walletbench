import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRunById } from "@/lib/db-queries";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const run = getRunById(db, params.id);
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json(run);
}
