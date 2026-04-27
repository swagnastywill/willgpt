import { isAdmin } from "@/lib/admin";
import { ensureSchema, sql } from "@/lib/db";
import AdminLogin from "./login";
import AdminLogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  session_id: string;
  user_text: string;
  has_image: boolean;
  response: string | null;
  status: string;
  created_at: string;
};

export default async function AdminPage() {
  const ok = await isAdmin();
  if (!ok) {
    return <AdminLogin />;
  }

  await ensureSchema();
  const messages = (await sql`
    SELECT id, session_id, user_text, has_image, response, status, created_at
    FROM messages
    ORDER BY created_at DESC
    LIMIT 200
  `) as Row[];

  const totals = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(DISTINCT session_id)::int AS sessions,
      COUNT(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS today
    FROM messages
  `) as { total: number; sessions: number; today: number }[];

  const stats = totals[0] ?? { total: 0, sessions: 0, today: 0 };

  const grouped = new Map<string, Row[]>();
  for (const m of messages) {
    if (!grouped.has(m.session_id)) grouped.set(m.session_id, []);
    grouped.get(m.session_id)!.push(m);
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">admin</h1>
        <AdminLogoutButton />
      </header>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="total messages" value={stats.total} />
        <Stat label="unique sessions" value={stats.sessions} />
        <Stat label="last 24h" value={stats.today} />
      </div>

      <div className="space-y-6">
        {[...grouped.entries()].map(([sid, msgs]) => (
          <section
            key={sid}
            className="border border-black/10 dark:border-white/10 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3 text-xs text-neutral-500">
              <span className="font-mono">{sid.slice(0, 8)}</span>
              <span>
                {msgs.length} msg{msgs.length === 1 ? "" : "s"} · last{" "}
                {new Date(msgs[0].created_at).toLocaleString()}
              </span>
            </div>
            <div className="space-y-3">
              {msgs
                .slice()
                .reverse()
                .map((m) => (
                  <div key={m.id}>
                    <div className="flex justify-end mb-1">
                      <div className="max-w-[78%] bg-[var(--bubble-me)] text-white px-3 py-1.5 rounded-2xl text-sm whitespace-pre-wrap break-words">
                        {m.has_image && (
                          <span className="text-xs opacity-70 mr-1">
                            [image]
                          </span>
                        )}
                        {m.user_text || "(no text)"}
                      </div>
                    </div>
                    {m.response && (
                      <div className="flex justify-start">
                        <div className="max-w-[78%] bg-[var(--bubble-them)] text-[var(--foreground)] px-3 py-1.5 rounded-2xl text-sm whitespace-pre-wrap break-words">
                          {m.response}
                        </div>
                      </div>
                    )}
                    {!m.response && (
                      <div className="text-xs text-neutral-500 pl-2">
                        ({m.status})
                      </div>
                    )}
                    <div className="text-[10px] text-neutral-500 text-right mt-1">
                      {new Date(m.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
        {grouped.size === 0 && (
          <p className="text-sm text-neutral-500">no messages yet.</p>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-black/10 dark:border-white/10 rounded-2xl p-3">
      <div className="text-xs text-neutral-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
