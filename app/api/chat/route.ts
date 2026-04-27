import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { ensureSchema, sql, type MessageRow } from "@/lib/db";
import { getOrCreateSessionId } from "@/lib/session";
import { anthropic, MODEL } from "@/lib/anthropic";
import { SYSTEM_PROMPT } from "@/lib/persona";
import { computeQueueTimes } from "@/lib/queue";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT = 1500;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type AllowedMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";
type ImagePayload = { mediaType: AllowedMediaType; base64: string };

type ChatRequest = {
  text: string;
  image?: { mediaType: string; base64: string } | null;
};

type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicImageBlock = {
  type: "image";
  source: { type: "base64"; media_type: AllowedMediaType; data: string };
};
type AnthropicUserBlock = AnthropicTextBlock | AnthropicImageBlock;

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      { error: "your phone sent garbage. try again." },
      { status: 400 },
    );
  }

  const text = (body.text ?? "").toString().trim();
  if (!text && !body.image) {
    return NextResponse.json(
      { error: "u didnt say anything bro" },
      { status: 400 },
    );
  }
  if (text.length > MAX_TEXT) {
    return NextResponse.json(
      { error: "ok thats too much to read" },
      { status: 400 },
    );
  }

  let image: ImagePayload | null = null;
  if (body.image) {
    if (!ALLOWED_IMAGE_TYPES.has(body.image.mediaType)) {
      return NextResponse.json(
        { error: "what kinda file is that. png/jpg/webp/gif only" },
        { status: 400 },
      );
    }
    const approxBytes = Math.floor((body.image.base64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "image too thicc (4mb max)" },
        { status: 400 },
      );
    }
    image = {
      mediaType: body.image.mediaType as AllowedMediaType,
      base64: body.image.base64,
    };
  }

  await ensureSchema();
  const sessionId = await getOrCreateSessionId();

  const recent = (await sql`
    SELECT COUNT(*)::int AS c FROM messages
    WHERE session_id = ${sessionId}
      AND created_at > now() - interval '10 minutes'
  `) as { c: number }[];
  if (recent[0]?.c >= 5) {
    return NextResponse.json(
      { error: "chill bro im typing. wait a few min" },
      { status: 429 },
    );
  }
  const daily = (await sql`
    SELECT COUNT(*)::int AS c FROM messages
    WHERE session_id = ${sessionId}
      AND created_at > now() - interval '1 day'
  `) as { c: number }[];
  if (daily[0]?.c >= 25) {
    return NextResponse.json(
      { error: "ok we talked enough today. hmu tomorrow" },
      { status: 429 },
    );
  }

  const { queuedSeconds, totalSeconds, shownWaitSeconds } = computeQueueTimes();
  const messageId = randomUUID();

  await sql`
    INSERT INTO messages (
      id, session_id, user_text, has_image,
      status, queued_until, ready_at
    ) VALUES (
      ${messageId},
      ${sessionId},
      ${text},
      ${image !== null},
      'pending',
      now() + ${`${queuedSeconds} seconds`}::interval,
      now() + ${`${totalSeconds} seconds`}::interval
    )
  `;

  after(async () => {
    try {
      const history = (await sql`
        SELECT user_text, response, has_image
        FROM messages
        WHERE session_id = ${sessionId}
          AND id <> ${messageId}
          AND response IS NOT NULL
          AND status = 'ready'
        ORDER BY created_at DESC
        LIMIT 8
      `) as Pick<MessageRow, "user_text" | "response" | "has_image">[];

      const ordered = history.reverse();
      const messages: { role: "user" | "assistant"; content: string | AnthropicUserBlock[] }[] = [];
      for (const h of ordered) {
        messages.push({
          role: "user",
          content: h.user_text || (h.has_image ? "[sent an image]" : ""),
        });
        if (h.response) {
          messages.push({ role: "assistant", content: h.response });
        }
      }

      const currentContent: AnthropicUserBlock[] = [];
      if (image) {
        currentContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: image.mediaType,
            data: image.base64,
          },
        });
      }
      currentContent.push({ type: "text", text: text || "(image only, no text)" });
      messages.push({ role: "user", content: currentContent });

      const result = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 220,
        system: SYSTEM_PROMPT,
        messages,
      });

      const responseText = result.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim();

      await sql`
        UPDATE messages
        SET response = ${responseText || "lol my bad got distracted"},
            status = 'ready'
        WHERE id = ${messageId}
      `;
    } catch (err) {
      console.error("[chat] generation failed", err);
      await sql`
        UPDATE messages
        SET response = 'sry phone died lol try again',
            status = 'error'
        WHERE id = ${messageId}
      `.catch(() => {});
    }
  });

  return NextResponse.json({
    messageId,
    shownWaitSeconds,
  });
}
