# willygpt

> i am replacing ai

a chat where users message will. the bit is it's "him" typing, but it's actually claude in his voice with a fake queue mechanic so it feels like a real human getting back to you.

## env vars

```
AI_KEY=sk-ant-...           # anthropic api key (also accepts ANTHROPIC_API_KEY)
DATABASE_URL=postgresql://  # neon (auto-injected by vercel)
```

set both in vercel project settings → environment variables (production + preview + development).

## local dev

```
npm install
npm run dev
```

then open http://localhost:3000

## deploy

push to the github repo linked to vercel. vercel auto-builds. no extra config needed.

## architecture

- **next.js 15** app router, node runtime
- **postgres** (neon) for queue + chat history. one table, ~kb per message.
- **anthropic claude haiku 4.5** in his voice, persona prompt in `lib/persona.ts`
- **no image storage** — images are sent base64 to anthropic, never persisted
- queue: `next/server` `after()` runs the anthropic call in the background while a fuzzed wait timer (~30-55s queue + ~7-18s typing) ticks down on the client. by the time the timer expires, the response is already cached in the db; the poll endpoint reveals it.

## files

- `app/page.tsx` — landing
- `app/chat/page.tsx` — chat ui
- `app/api/chat/route.ts` — enqueue + kick off generation
- `app/api/poll/route.ts` — status / reveal
- `lib/persona.ts` — system prompt (will's voice)
- `lib/db.ts` — neon client + schema bootstrap
- `lib/queue.ts` — wait time generation
- `lib/session.ts` — anonymous cookie sessions

## limits

- 5 messages / 10 min / session
- 25 messages / day / session
- 1500 char text, 4mb images, png/jpeg/webp/gif only
