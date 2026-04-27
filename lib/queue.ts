export function jitter(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function computeQueueTimes(): {
  queuedSeconds: number;
  typingSeconds: number;
  totalSeconds: number;
  shownWaitSeconds: number;
} {
  const queuedSeconds = Math.round(jitter(28, 58));
  const typingSeconds = Math.round(jitter(7, 18));
  const totalSeconds = queuedSeconds + typingSeconds;
  const fudge = 0.85 + Math.random() * 0.3;
  const shownWaitSeconds = Math.max(15, Math.round(totalSeconds * fudge));
  return { queuedSeconds, typingSeconds, totalSeconds, shownWaitSeconds };
}
