const store = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 100

export function rateLimit(identifier: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  let entry = store.get(identifier)
  if (!entry) {
    entry = { count: 1, resetAt: now + WINDOW_MS }
    store.set(identifier, entry)
    return { ok: true, remaining: MAX_REQUESTS - 1 }
  }
  if (now > entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS }
    store.set(identifier, entry)
    return { ok: true, remaining: MAX_REQUESTS - 1 }
  }
  entry.count++
  const ok = entry.count <= MAX_REQUESTS
  return { ok, remaining: Math.max(0, MAX_REQUESTS - entry.count) }
}

export function rateLimitEvents(identifier: string, maxPerMinute = 30): { ok: boolean } {
  const key = `events:${identifier}`
  const now = Date.now()
  let entry = store.get(key)
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  entry.count++
  return { ok: entry.count <= maxPerMinute }
}
