import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  client = neon(url);
  return client;
}

export const sql: NeonQueryFunction<false, false> = ((
  strings: TemplateStringsArray,
  ...values: unknown[]
) => {
  return getClient()(strings, ...values);
}) as NeonQueryFunction<false, false>;

let initPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const c = getClient();
      await c`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          user_text TEXT NOT NULL,
          has_image BOOLEAN NOT NULL DEFAULT FALSE,
          response TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          queued_until TIMESTAMPTZ NOT NULL,
          ready_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await c`
        CREATE INDEX IF NOT EXISTS idx_messages_session_created
          ON messages (session_id, created_at)
      `;
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export type MessageRow = {
  id: string;
  session_id: string;
  user_text: string;
  has_image: boolean;
  response: string | null;
  status: "pending" | "ready" | "error";
  queued_until: string;
  ready_at: string;
  created_at: string;
};
