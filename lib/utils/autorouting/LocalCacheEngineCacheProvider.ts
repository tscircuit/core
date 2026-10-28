import type { CacheProvider } from "@tscircuit/capacity-autorouter"
import type { LocalCacheEngine } from "@tscircuit/props"

const AUTOROUTER_CACHE_KEY_PREFIX = "capacity-autorouter:"

const cacheProvidersByLocalCacheEngine = new WeakMap<
  LocalCacheEngine,
  LocalCacheEngineCacheProvider
>()

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  )
}

function isAsyncFunction(fn: (...args: any[]) => unknown): boolean {
  return fn.constructor.name === "AsyncFunction"
}

export class LocalCacheEngineCacheProvider implements CacheProvider {
  isSyncCache: boolean
  cacheHits = 0
  cacheMisses = 0
  cacheHitsByPrefix: Record<string, number> = {}
  cacheMissesByPrefix: Record<string, number> = {}

  private knownCacheKeys = new Set<string>()

  constructor(private readonly localCacheEngine: LocalCacheEngine) {
    this.isSyncCache =
      !isAsyncFunction(localCacheEngine.getItem) &&
      !isAsyncFunction(localCacheEngine.setItem)
  }

  getCachedSolutionSync(cacheKey: string): any {
    if (!this.isSyncCache) return undefined
    this.knownCacheKeys.add(cacheKey)

    try {
      const cachedItem = this.localCacheEngine.getItem(
        this.getLocalCacheEngineKey(cacheKey),
      )
      if (isPromiseLike(cachedItem)) {
        this.isSyncCache = false
        void Promise.resolve(cachedItem).catch(() => {})
        this.recordCacheMiss(cacheKey)
        return undefined
      }
      return this.parseCachedItem(cacheKey, cachedItem)
    } catch {
      this.recordCacheMiss(cacheKey)
      return undefined
    }
  }

  async getCachedSolution(cacheKey: string): Promise<any> {
    this.knownCacheKeys.add(cacheKey)

    try {
      const cachedItem = await this.localCacheEngine.getItem(
        this.getLocalCacheEngineKey(cacheKey),
      )
      return this.parseCachedItem(cacheKey, cachedItem)
    } catch {
      this.recordCacheMiss(cacheKey)
      return undefined
    }
  }

  setCachedSolutionSync(cacheKey: string, cachedSolution: any): void {
    if (!this.isSyncCache) return
    this.knownCacheKeys.add(cacheKey)

    try {
      const serializedSolution = JSON.stringify(cachedSolution)
      if (serializedSolution === undefined) return
      const writeResult = this.localCacheEngine.setItem(
        this.getLocalCacheEngineKey(cacheKey),
        serializedSolution,
      )
      if (isPromiseLike(writeResult)) {
        this.isSyncCache = false
        void Promise.resolve(writeResult).catch(() => {})
      }
    } catch {}
  }

  async setCachedSolution(
    cacheKey: string,
    cachedSolution: any,
  ): Promise<void> {
    this.knownCacheKeys.add(cacheKey)

    try {
      const serializedSolution = JSON.stringify(cachedSolution)
      if (serializedSolution === undefined) return
      await this.localCacheEngine.setItem(
        this.getLocalCacheEngineKey(cacheKey),
        serializedSolution,
      )
    } catch {}
  }

  getAllCacheKeys(): string[] {
    return [...this.knownCacheKeys]
  }

  clearCache(): void {
    for (const cacheKey of this.knownCacheKeys) {
      const localCacheEngineKey = this.getLocalCacheEngineKey(cacheKey)
      try {
        const clearResult = this.localCacheEngine.removeItem
          ? this.localCacheEngine.removeItem(localCacheEngineKey)
          : this.localCacheEngine.setItem(localCacheEngineKey, "null")
        if (isPromiseLike(clearResult)) {
          void Promise.resolve(clearResult).catch(() => {})
        }
      } catch {}
    }

    this.knownCacheKeys.clear()
    this.cacheHits = 0
    this.cacheMisses = 0
    this.cacheHitsByPrefix = {}
    this.cacheMissesByPrefix = {}
  }

  private getLocalCacheEngineKey(cacheKey: string): string {
    return `${AUTOROUTER_CACHE_KEY_PREFIX}${cacheKey}`
  }

  private parseCachedItem(cacheKey: string, cachedItem: string | null): any {
    if (cachedItem === null) {
      this.recordCacheMiss(cacheKey)
      return undefined
    }

    try {
      const cachedSolution = JSON.parse(cachedItem)
      if (cachedSolution === null) {
        this.recordCacheMiss(cacheKey)
        return undefined
      }
      this.recordCacheHit(cacheKey)
      return cachedSolution
    } catch {
      this.recordCacheMiss(cacheKey)
      return undefined
    }
  }

  private recordCacheHit(cacheKey: string): void {
    this.cacheHits++
    const prefix = cacheKey.split(":")[0]!
    this.cacheHitsByPrefix[prefix] = (this.cacheHitsByPrefix[prefix] ?? 0) + 1
  }

  private recordCacheMiss(cacheKey: string): void {
    this.cacheMisses++
    const prefix = cacheKey.split(":")[0]!
    this.cacheMissesByPrefix[prefix] =
      (this.cacheMissesByPrefix[prefix] ?? 0) + 1
  }
}

export function getCacheProviderForLocalCacheEngine(
  localCacheEngine: LocalCacheEngine,
): CacheProvider {
  let cacheProvider = cacheProvidersByLocalCacheEngine.get(localCacheEngine)
  if (!cacheProvider) {
    cacheProvider = new LocalCacheEngineCacheProvider(localCacheEngine)
    cacheProvidersByLocalCacheEngine.set(localCacheEngine, cacheProvider)
  }
  return cacheProvider
}
