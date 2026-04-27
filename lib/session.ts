import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE = "wgpt_sid";

export async function getOrCreateSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && /^[a-z0-9-]{20,}$/i.test(existing)) return existing;
  const id = randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export async function readSessionId(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  if (v && /^[a-z0-9-]{20,}$/i.test(v)) return v;
  return null;
}
