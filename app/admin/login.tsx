"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [token, setToken] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "nope");
        setBusy(false);
        return;
      }
      window.location.reload();
    } catch {
      setErr("network err");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm flex flex-col gap-3 text-center"
      >
        <h1 className="font-display text-3xl mb-2">who goes there</h1>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="token"
          autoFocus
          className="w-full rounded-xl px-4 py-3 bg-black/5 dark:bg-white/10 outline-none focus:ring-1 focus:ring-[#007aff] text-base"
        />
        <button
          type="submit"
          disabled={!token || busy}
          className="rounded-full bg-[#007aff] disabled:bg-neutral-400 text-white py-3 font-medium"
        >
          {busy ? "..." : "enter"}
        </button>
        {err && <p className="text-sm text-red-500">{err}</p>}
      </form>
    </main>
  );
}
