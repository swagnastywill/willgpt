import { NextRequest, NextResponse } from "next/server";
import { getAdminToken, setAdminCookie } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const provided = (body.token || "").toString();
  const expected = getAdminToken();
  if (!expected) {
    return NextResponse.json(
      { error: "admin not configured" },
      { status: 500 },
    );
  }
  if (provided.length !== expected.length) {
    return NextResponse.json({ error: "nope" }, { status: 401 });
  }
  let r = 0;
  for (let i = 0; i < provided.length; i++) {
    r |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (r !== 0) {
    return NextResponse.json({ error: "nope" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
