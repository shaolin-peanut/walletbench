import { NextResponse } from "next/server";
import { fixtures } from "@/lib/fixtures";

export async function GET() {
  return NextResponse.json(fixtures.scoreResults);
}
