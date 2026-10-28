import type { CacheProvider } from "@tscircuit/capacity-autorouter"
import type { LocalCacheEngine } from "@tscircuit/props"
import { LocalCacheEngineCacheProvider } from "./LocalCacheEngineCacheProvider"

const cacheProvidersByLocalCacheEngine = new WeakMap<
  LocalCacheEngine,
  LocalCacheEngineCacheProvider
>()

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
