import { expect, test } from "bun:test"
import {
  GLOBAL_LOCAL_CACHE_ENGINE_SYMBOL,
  type LocalCacheEngine,
  RootCircuit,
} from "lib"

const createCacheEngine = (): LocalCacheEngine => ({
  getItem: () => null,
  setItem: () => {},
})

test("a circuit inherits a cache engine installed by its worker host", () => {
  const cacheEngine = createCacheEngine()
  Reflect.set(globalThis, GLOBAL_LOCAL_CACHE_ENGINE_SYMBOL, cacheEngine)

  try {
    const circuit = new RootCircuit()
    expect(circuit.platform?.localCacheEngine).toBe(cacheEngine)
  } finally {
    Reflect.deleteProperty(globalThis, GLOBAL_LOCAL_CACHE_ENGINE_SYMBOL)
  }
})

test("an explicit platform cache engine takes precedence over the host cache", () => {
  const hostCacheEngine = createCacheEngine()
  const explicitCacheEngine = createCacheEngine()
  Reflect.set(globalThis, GLOBAL_LOCAL_CACHE_ENGINE_SYMBOL, hostCacheEngine)

  try {
    const circuit = new RootCircuit({
      platform: { localCacheEngine: explicitCacheEngine },
    })
    expect(circuit.platform?.localCacheEngine).toBe(explicitCacheEngine)
  } finally {
    Reflect.deleteProperty(globalThis, GLOBAL_LOCAL_CACHE_ENGINE_SYMBOL)
  }
})
