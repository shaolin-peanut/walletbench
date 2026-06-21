import { NextResponse } from "next/server";
import { fixtures } from "@/lib/fixtures";

export async function GET() {
  // TODO: replace with DB query after E3
  return NextResponse.json(fixtures.receipts);
}
