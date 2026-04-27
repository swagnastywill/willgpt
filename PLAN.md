# willygpt — plan

> "i am replacing ai"
> a chat site where you message will. behind the scenes it's claude pretending to be will. don't tell anyone.

## the bit

- public-facing: it's just will, hand-typing replies. he's busy though, so there's a wait.
- actually: anthropic api call, cheap model, system prompt loaded with will's voice + bio.
- the friction is the joke. ai is instant; will is not. the queue + typing dots sell it.

## stack

- **next.js 16** (app router) on vercel
- **fluid compute** functions (default) — node runtime
- **ai sdk v6** via vercel ai gateway — `"anthropic/claude-haiku-4-5"` for cost
- **vercel blob** for image uploads (private, signed read urls)
- **upstash redis** (vercel marketplace) for per-session queue state + simple rate limiting
- **tailwind + shadcn/ui** for chat ui
- **vercel.ts** for project config

no auth. session = anonymous cookie/uuid. no db beyond redis ephemeral state.

## pages

1. **`/`** — landing
   - hero: photo (`will.png`), name, "i am replacing ai"
   - 1-2 sentence mission in his voice (lowercase, gen-z, dry)
   - cta button → `/chat`
2. **`/chat`** — the messaging app
   - imessage-ish bubbles, his on left, yours on right
   - text input + image upload button (paperclip)
   - "willy is busy. estimated wait time ~47s" banner when queued
   - typing indicator (3 bouncing dots) while "he writes"
   - mobile-first, looks good on desktop too

## the queue mechanic

per-session "wait" state stored in redis:

1. user sends message → enqueue at `now + base_delay`
2. `base_delay` = `30 + jitter(0, 25)` seconds — never round, never exact
3. ui shows "willy is busy, est. wait ~Xs" where X is also fuzzed (±10%) so it never matches the real timer. don't show a precise countdown.
4. when timer expires, show typing dots for `8 + jitter(0, 12)` seconds
5. then stream the response

response generation kicks off early (in background) so by the time the wait expires, the text is ready and we just reveal it. user never sees latency.

implementation: vercel **workflow** (durable, pause/resume, crash-safe) is the clean fit, but for v1 a single function with `setTimeout` + background generation via `waitUntil()` is fine. revisit if traffic shows up.

## voice / system prompt

stuff the onboarding doc into the system prompt. key rules baked in:

- always lowercase, casual, gen-z, short replies. fragments ok. "lol" "tbh" "idk" "fr"
- if asked something he'd actually know (osmo, filmmaking, sf, skating, columbia, a24, the cap table names listed in his bio) — answer it casually with the real info
- if asked something he wouldn't know — play dumb naturally. "lol no idea". "sounds fake". "ask chatgpt"
- never break character. never say "as an ai". never explain the joke.
- never reveal he's claude. if accused → deflect, joke, deny.
- short. one to three lines max usually. occasional longer reply when the topic warrants.
- never use em dashes (he doesn't type those). regular hyphens or just commas.

system prompt lives in `lib/persona.ts`. the onboarding doc gets pasted in verbatim as context.

## images

- upload to vercel blob, private, returns signed url
- pass image as content block to claude haiku 4.5 (vision capable)
- response treats it like will would: "lmao what is this", "ok yeah that's cool", or actual commentary if it's something he'd recognize

## api keys / env vars you need to give me

| key | where to get it | purpose |
|---|---|---|
| `AI_GATEWAY_API_KEY` | vercel dashboard → ai gateway → api keys (or auto-injected via oidc when deployed on vercel) | claude haiku calls through gateway. on vercel itself you can skip this and use the oidc token. |
| `BLOB_READ_WRITE_TOKEN` | auto-provisioned when you create a blob store in the vercel dashboard | image uploads |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or upstash equivalents) | install upstash redis from vercel marketplace, env vars auto-injected | queue state, rate limiting |

**that's it.** if you only want to run locally first, just `ANTHROPIC_API_KEY` from console.anthropic.com works as a fallback (i'll wire both paths).

optional but recommended:
- `VERCEL_BOTID` — drop-in bot detection so people can't ddos the queue
- nothing else

## abuse / cost guardrails

- rate limit: max 5 messages per session per 10 min, max 20/day
- max image size 4mb, 1 image per message
- haiku 4.5 is ~$1/mtok input, ~$5/mtok output. with the queue gating volume, this stays cheap.
- short max_tokens (~200) reinforces the voice and caps spend

## file layout

```
willgpt/
  app/
    page.tsx              # landing
    chat/page.tsx         # chat ui (client)
    api/
      chat/route.ts       # POST: enqueue + trigger generation
      poll/route.ts       # GET: status + reveal when ready
      upload/route.ts     # POST: blob upload
  lib/
    persona.ts            # system prompt + onboarding doc
    queue.ts              # redis helpers
    anthropic.ts          # ai sdk client through gateway
  public/
    will.png              # already there
  vercel.ts
  package.json
```

## build order

1. scaffold next + tailwind + shadcn
2. landing page with photo + mission line
3. chat ui (no backend yet) — get the look right
4. anthropic call + persona prompt — verify voice in dev
5. queue + fake-typing mechanic
6. blob image upload + vision
7. rate limit + botid
8. deploy to vercel, test on phone

## open questions for you

1. mission line wording — want me to draft 3 options in your voice or do you have one in mind?
2. should refusing-to-answer-as-ai be playful ("lol bro im just typing") or annoyed ("stop asking")? leaning playful.
3. avatar in chat: cropped circle of `will.png`, or a different photo for the chat header?
4. domain — willygpt.com? willyhopps.com/gpt? or just whatever vercel gives us for v1?
