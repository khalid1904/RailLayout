interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

const ipRequests = new Map<string, number[]>();

export function checkRateLimit(
  ip: string,
  maxRequests = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const timestamps = (ipRequests.get(ip) ?? []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= maxRequests) {
    return false;
  }
  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  return true;
}

export function pnrCacheKey(pnr: string): string {
  return `pnr:${pnr}`;
}
