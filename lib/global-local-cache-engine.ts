import type { LocalCacheEngine } from "./local-cache-engine"

/**
 * Allows hosts that execute tscircuit inside an isolated worker to install a
 * cache engine before the circuit is created. `Symbol.for` keeps the contract
 * stable even when the host and core are bundled separately.
 */
export const GLOBAL_LOCAL_CACHE_ENGINE_SYMBOL = Symbol.for(
  "tscircuit.localCacheEngine",
)

export const getGlobalLocalCacheEngine = (): LocalCacheEngine | undefined => {
  const cacheEngine = Reflect.get(
    globalThis,
    GLOBAL_LOCAL_CACHE_ENGINE_SYMBOL,
  ) as Partial<LocalCacheEngine> | undefined

  if (
    !cacheEngine ||
    typeof cacheEngine.getItem !== "function" ||
    typeof cacheEngine.setItem !== "function"
  ) {
    return undefined
  }

  return cacheEngine as LocalCacheEngine
}
