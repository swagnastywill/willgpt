import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, sql, type MessageRow } from "@/lib/db";
import { readSessionId } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  await ensureSchema();
  const sessionId = await readSessionId();
  if (!sessionId) {
    return NextResponse.json({ error: "no session" }, { status: 401 });
  }

  const rows = (await sql`
    SELECT id, session_id, status, response,
           queued_until, ready_at,
           EXTRACT(EPOCH FROM (queued_until - now()))::float AS queued_remaining,
           EXTRACT(EPOCH FROM (ready_at - now()))::float AS ready_remaining
    FROM messages
    WHERE id = ${id} AND session_id = ${sessionId}
    LIMIT 1
  `) as (Pick<
    MessageRow,
    "id" | "session_id" | "status" | "response" | "queued_until" | "ready_at"
  > & { queued_remaining: number; ready_remaining: number })[];

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (row.ready_remaining > 0) {
    if (row.queued_remaining > 0) {
      return NextResponse.json({ phase: "queued" });
    }
    return NextResponse.json({ phase: "typing" });
  }

  if (row.status === "ready" && row.response) {
    return NextResponse.json({ phase: "ready", response: row.response });
  }
  if (row.status === "error") {
    return NextResponse.json({
      phase: "ready",
      response: row.response || "sry phone died lol try again",
    });
  }
  return NextResponse.json({ phase: "typing" });
}
