import { NextResponse } from "next/server";
import { getStatus } from "@/lib/status";
import { getOrCreateSessionId } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const sessionId = await getOrCreateSessionId();
  const s = getStatus(new Date(), sessionId);
  return NextResponse.json(
    { state: s.state, label: s.label },
    { headers: { "cache-control": "no-store" } },
  );
}
