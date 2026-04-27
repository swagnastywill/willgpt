export type StatusState = "locked_in" | "afk" | "sleeping";

export interface Status {
  state: StatusState;
  label: string;
  minQueuedSec: number;
  maxQueuedSec: number;
}

function pseudoRandom(seed: number, salt: number): number {
  const x = Math.sin(seed * salt + salt) * 10000;
  return x - Math.floor(x);
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function sfHourMinute(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return (hour % 24) * 60 + minute;
}

function sfDayKey(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  return y * 10000 + m * 100 + d;
}

export function getStatus(
  now: Date = new Date(),
  sessionSeed: string = "global",
): Status {
  const userSalt = hashString(sessionSeed);
  const totalMin = sfHourMinute(now);
  const day = sfDayKey(now);

  const wakeFuzz = Math.floor(pseudoRandom(day, 7919) * 40) - 20;
  const sleepFuzz = Math.floor(pseudoRandom(day, 3539) * 40) - 20;
  const wakeMin = 8 * 60 + 15 + wakeFuzz;
  const sleepMin = 60 + sleepFuzz;

  if (totalMin >= sleepMin && totalMin < wakeMin) {
    const minsUntilWake = wakeMin - totalMin;
    const hrs = Math.max(1, Math.round(minsUntilWake / 60));
    return {
      state: "sleeping",
      label: `willy is sleeping · back in ~${hrs}hr${hrs > 1 ? "s" : ""}`,
      minQueuedSec: Math.max(45 * 60, minsUntilWake * 60 - 600),
      maxQueuedSec: minsUntilWake * 60 + 600,
    };
  }

  const bucket = Math.floor(now.getTime() / (1000 * 60 * 5));
  const afkRoll = pseudoRandom(bucket ^ userSalt, 31337);
  if (afkRoll < 0.16) {
    return {
      state: "afk",
      label: "willy is afk",
      minQueuedSec: 2 * 60,
      maxQueuedSec: 6 * 60,
    };
  }

  return {
    state: "locked_in",
    label: "willy locked in · responding fast",
    minQueuedSec: 9,
    maxQueuedSec: 19,
  };
}
