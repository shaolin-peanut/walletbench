import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  // TODO: verify signature, update wallet, emit TraceEvent (E3)
  console.log("[stripe-webhook]", payload.type, payload.id);
  return NextResponse.json({ received: true });
}
