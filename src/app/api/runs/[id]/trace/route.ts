import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getTraceEvents } from "@/lib/db-queries";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const events = getTraceEvents(db, params.id);
  return NextResponse.json(events);
}
