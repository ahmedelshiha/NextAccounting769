type CacheEntry = { value: any; expiresAt: number | null }

class InMemoryCache {
  private store: Map<string, CacheEntry> = new Map()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) { this.store.delete(key); return null }
    return entry.value as T
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null
    this.store.set(key, { value, expiresAt })
  }

  async delete(key: string): Promise<void> { this.store.delete(key) }

  async deletePattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.split('*').map(this.escapeRegex).join('.*') + '$')
    for (const k of Array.from(this.store.keys())) { if (regex.test(k)) this.store.delete(k) }
  }

  private escapeRegex(str: string) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
}

export class CacheService {
  private backend: any

  constructor() {
    // Lazy initialization to avoid throwing in environments without Redis configured
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    if (redisUrl) {
      try {
        // Only require the server-only Redis cache implementation at runtime on the server
        if (typeof window === 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { default: RedisCache } = require('./cache/redis')
          this.backend = new RedisCache(redisUrl)
        } else {
          // In browser environments, avoid pulling server-only modules into the bundle
          this.backend = new InMemoryCache()
        }
      } catch (e) {
        // If Redis client not available, fallback to in-memory and log
        console.warn('RedisCache unavailable, falling back to in-memory cache:', (e as any)?.message)
        this.backend = new InMemoryCache()
      }
    } else {
      this.backend = new InMemoryCache()
    }
  }

  async get<T>(key: string): Promise<T | null> { return this.backend.get(key) }
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> { return this.backend.set(key, value, ttlSeconds) }
  async delete(key: string): Promise<void> { return this.backend.delete(key) }
  async deletePattern(pattern: string): Promise<void> { return this.backend.deletePattern(pattern) }
}
