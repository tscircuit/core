import * as Effect from "effect/Effect"
import { corePromise } from "./effect/core-error"

export interface LocalCacheEngine {
  getItem(key: string): string | Promise<string | null> | null
  setItem(key: string, value: string): void | Promise<void>
  removeItem?(key: string): void | Promise<void>
}

export type LocalCacheKey = string

/** External caches may be synchronous or asynchronous and cannot be aborted. */
export function readLocalCacheEffect(request: {
  cacheEngine?: LocalCacheEngine
  cacheKey: LocalCacheKey
}) {
  const cacheEngine = request.cacheEngine
  if (!cacheEngine) return Effect.succeed(null)
  // Legacy async consumers await configured engines even when they return a value.
  return corePromise(
    () => Promise.resolve(cacheEngine.getItem(request.cacheKey)),
    "read_local_cache",
  )
}

export function writeLocalCacheEffect(request: {
  cacheEngine?: LocalCacheEngine
  cacheKey: LocalCacheKey
  value: string
}) {
  const cacheEngine = request.cacheEngine
  if (!cacheEngine) return Effect.void
  return corePromise(
    () => Promise.resolve(cacheEngine.setItem(request.cacheKey, request.value)),
    "write_local_cache",
  )
}

export function removeLocalCacheEffect(request: {
  cacheEngine?: LocalCacheEngine
  cacheKey: LocalCacheKey
}) {
  const cacheEngine = request.cacheEngine
  if (!cacheEngine) return Effect.void
  return corePromise(
    () => Promise.resolve(cacheEngine.removeItem?.(request.cacheKey)),
    "remove_local_cache",
  )
}
