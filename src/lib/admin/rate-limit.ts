// Best-effort per-process throttle, not a distributed or provider-level limit.
// No credentials or email addresses are stored here.
export function createLoginLimiter(limit = 10, windowMs = 10 * 60 * 1000, capacity = 10000) {
  const attempts = new Map<string, { count: number; resetAt: number }>();
  return (key: string, now = Date.now()) => {
    for (const [k, value] of attempts) if (value.resetAt <= now) attempts.delete(k);
    const existing = attempts.get(key);
    if (!existing && attempts.size >= capacity) return false;
    const entry = existing ?? { count: 0, resetAt: now + windowMs };
    if (entry.count >= limit) return false;
    entry.count += 1;
    attempts.set(key, entry);
    return true;
  };
}
export const allowLoginAttempt = createLoginLimiter();
