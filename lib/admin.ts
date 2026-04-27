import { cookies } from "next/headers";

const COOKIE = "wgpt_admin";

export function getAdminToken(): string | null {
  const t = process.env.ADMIN_TOKEN;
  if (!t || t.length < 8) return null;
  return t;
}

export async function isAdmin(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  if (!v) return false;
  return safeEqual(v, token);
}

export async function setAdminCookie(): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error("ADMIN_TOKEN not set");
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}
