import type { LocalCacheEngine } from "./local-cache-engine"

/**
 * Allows hosts that execute tscircuit inside an isolated worker to install a
 * cache engine before the circuit is created. `Symbol.for` keeps the contract
 * stable even when the host and core are bundled separately.
 */
export const INHERITED_LOCAL_CACHE_ENGINE_SYMBOL = Symbol.for(
  "tscircuit.inheritedLocalCacheEngine",
)

export const getInheritedLocalCacheEngine = ():
  | LocalCacheEngine
  | undefined => {
  const cacheEngine = Reflect.get(
    globalThis,
    INHERITED_LOCAL_CACHE_ENGINE_SYMBOL,
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
