"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Bubble =
  | { kind: "me"; text: string; imageUrl?: string }
  | { kind: "them"; text: string }
  | { kind: "queued"; messageId: string; shownWaitSeconds: number }
  | { kind: "typing" }
  | { kind: "system"; text: string };

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function fileToBase64(
  file: File,
): Promise<{ mediaType: string; base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [meta, b64] = dataUrl.split(",");
      const m = meta.match(/data:([^;]+);base64/);
      if (!m) return reject(new Error("bad image"));
      resolve({ mediaType: m[1], base64: b64, dataUrl });
    };
    reader.readAsDataURL(file);
  });
}

export default function ChatPage() {
  const [bubbles, setBubbles] = useState<Bubble[]>([
    {
      kind: "them",
      text: "welcome 2 willygpt! ask me anything",
    },
  ]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingImage, setPendingImage] = useState<{
    mediaType: string;
    base64: string;
    dataUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [bubbles]);

  const send = useCallback(async () => {
    const content = text.trim();
    if ((!content && !pendingImage) || pending) return;

    const userBubble: Bubble = {
      kind: "me",
      text: content,
      imageUrl: pendingImage?.dataUrl,
    };
    setBubbles((b) => [...b, userBubble]);
    setText("");
    const imgPayload = pendingImage
      ? { mediaType: pendingImage.mediaType, base64: pendingImage.base64 }
      : null;
    setPendingImage(null);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: content, image: imgPayload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBubbles((b) => [
          ...b,
          {
            kind: "system",
            text:
              data.error ||
              "lol something broke. i didnt use ai to code this so its kinda mid. try again.",
          },
        ]);
        setPending(false);
        return;
      }
      const data = (await res.json()) as {
        messageId: string;
        shownWaitSeconds: number;
      };
      setBubbles((b) => [
        ...b,
        {
          kind: "queued",
          messageId: data.messageId,
          shownWaitSeconds: data.shownWaitSeconds,
        },
      ]);
    } catch {
      setBubbles((b) => [
        ...b,
        {
          kind: "system",
          text: "rip. site is broken. i built this myself ok. refresh maybe.",
        },
      ]);
      setPending(false);
    }
  }, [text, pending, pendingImage]);

  const onPickImage = useCallback(async (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      setBubbles((b) => [
        ...b,
        { kind: "system", text: "image too thicc (4mb max). compress it lol" },
      ]);
      return;
    }
    try {
      const data = await fileToBase64(file);
      setPendingImage(data);
    } catch {
      setBubbles((b) => [
        ...b,
        { kind: "system", text: "what kinda image is that bro" },
      ]);
    }
  }, []);

  const onResolved = useCallback((messageId: string, response: string) => {
    setBubbles((prev) => {
      const next: Bubble[] = [];
      for (const b of prev) {
        if (
          (b.kind === "queued" && b.messageId === messageId) ||
          b.kind === "typing"
        ) {
          continue;
        }
        next.push(b);
      }
      next.push({ kind: "them", text: response });
      return next;
    });
    setPending(false);
  }, []);

  const onTransitionToTyping = useCallback((messageId: string) => {
    setBubbles((prev) => {
      const next: Bubble[] = [];
      let replaced = false;
      for (const b of prev) {
        if (b.kind === "queued" && b.messageId === messageId) {
          if (!replaced) {
            next.push({ kind: "typing" });
            replaced = true;
          }
          continue;
        }
        next.push(b);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-black/10 dark:border-white/10 sticky top-0 bg-[var(--background)]/90 backdrop-blur z-10">
        <Link
          href="/"
          className="text-[#007aff] text-sm shrink-0"
          aria-label="back"
        >
          ← back
        </Link>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="relative w-7 h-7 rounded-full overflow-hidden">
            <Image src="/will.png" alt="willy" fill sizes="28px" className="object-cover" />
          </div>
          <span className="font-display text-lg">willy</span>
        </div>
        <div className="w-10" />
      </header>

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5"
      >
        {bubbles.map((b, i) => (
          <BubbleView
            key={i}
            bubble={b}
            onResolved={onResolved}
            onTransitionToTyping={onTransitionToTyping}
          />
        ))}
      </div>

      <div className="border-t border-black/10 dark:border-white/10 p-2 sticky bottom-0 bg-[var(--background)]">
        {pendingImage && (
          <div className="px-2 pb-2 flex items-center gap-2">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage.dataUrl}
                alt="attachment"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => setPendingImage(null)}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              remove
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-lg leading-none"
            aria-label="add image"
          >
            +
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickImage(f);
              e.target.value = "";
            }}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="iMessage"
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-2 bg-black/5 dark:bg-white/10 outline-none focus:ring-1 focus:ring-[#007aff] max-h-32 text-base"
          />
          <button
            type="button"
            onClick={send}
            disabled={pending || (!text.trim() && !pendingImage)}
            className="shrink-0 w-9 h-9 rounded-full bg-[#007aff] disabled:bg-neutral-400 text-white flex items-center justify-center"
            aria-label="send"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function BubbleView({
  bubble,
  onResolved,
  onTransitionToTyping,
}: {
  bubble: Bubble;
  onResolved: (messageId: string, response: string) => void;
  onTransitionToTyping: (messageId: string) => void;
}) {
  if (bubble.kind === "me") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] flex flex-col items-end gap-1">
          {bubble.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bubble.imageUrl}
              alt="sent"
              className="max-w-full rounded-2xl"
            />
          )}
          {bubble.text && (
            <div className="bg-[var(--bubble-me)] text-white px-3.5 py-2 rounded-2xl whitespace-pre-wrap break-words">
              {bubble.text}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (bubble.kind === "them") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[78%] bg-[var(--bubble-them)] text-[var(--foreground)] px-3.5 py-2 rounded-2xl whitespace-pre-wrap break-words">
          {bubble.text}
        </div>
      </div>
    );
  }
  if (bubble.kind === "system") {
    return (
      <div className="flex justify-center">
        <div className="text-xs text-neutral-500 px-2 py-1">{bubble.text}</div>
      </div>
    );
  }
  if (bubble.kind === "typing") {
    return (
      <div className="flex justify-start">
        <div className="bg-[var(--bubble-them)] px-4 py-3 rounded-2xl">
          <span className="typing-dots">
            <span /> <span /> <span />
          </span>
        </div>
      </div>
    );
  }
  return (
    <QueuedBubble
      messageId={bubble.messageId}
      shownWaitSeconds={bubble.shownWaitSeconds}
      onResolved={onResolved}
      onTransitionToTyping={onTransitionToTyping}
    />
  );
}

function QueuedBubble({
  messageId,
  shownWaitSeconds,
  onResolved,
  onTransitionToTyping,
}: {
  messageId: string;
  shownWaitSeconds: number;
  onResolved: (messageId: string, response: string) => void;
  onTransitionToTyping: (messageId: string) => void;
}) {
  const [remaining, setRemaining] = useState(shownWaitSeconds);

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/poll?id=${encodeURIComponent(messageId)}`);
        if (!res.ok) {
          timer = setTimeout(poll, 3000);
          return;
        }
        const data = (await res.json()) as
          | { phase: "queued" }
          | { phase: "typing" }
          | { phase: "ready"; response: string };
        if (cancelled) return;
        if (data.phase === "ready") {
          onResolved(messageId, data.response);
          return;
        }
        if (data.phase === "typing") {
          onTransitionToTyping(messageId);
          return;
        }
        timer = setTimeout(poll, 2000);
      } catch {
        timer = setTimeout(poll, 3000);
      }
    };

    timer = setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [messageId, onResolved, onTransitionToTyping]);

  const label = useMemo(() => {
    if (remaining <= 0) return "willy is busy...";
    return `willy is busy. ~${remaining}s wait`;
  }, [remaining]);

  return (
    <div className="flex justify-center">
      <div className="text-xs text-neutral-500 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5">
        {label}
      </div>
    </div>
  );
}
