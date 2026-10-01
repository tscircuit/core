import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { corePromise, runCorePromise, runCoreSync } from "lib/effect/core-error"
import {
  readLocalCacheEffect,
  removeLocalCacheEffect,
  writeLocalCacheEffect,
  type LocalCacheKey,
} from "lib/local-cache-engine"

test("cache effects support sync and async engines without hiding external failures", async () => {
  const values = new Map<LocalCacheKey, string>()
  const synchronous = {
    getItem: (key: LocalCacheKey) => values.get(key) ?? null,
    setItem: (key: LocalCacheKey, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: LocalCacheKey) => {
      values.delete(key)
    },
  }
  const write = writeLocalCacheEffect({
    cacheEngine: synchronous,
    cacheKey: "part",
    value: "cached",
  })
  expect(values.size).toBe(0)
  await runCorePromise(write)
  expect(
    await runCorePromise(
      readLocalCacheEffect({ cacheEngine: synchronous, cacheKey: "part" }),
    ),
  ).toBe("cached")
  const asynchronous = {
    getItem: async (key: LocalCacheKey) => synchronous.getItem(key),
    setItem: async (key: LocalCacheKey, value: string) =>
      synchronous.setItem(key, value),
    removeItem: async (key: LocalCacheKey) => synchronous.removeItem(key),
  }
  await Effect.runPromise(
    writeLocalCacheEffect({
      cacheEngine: asynchronous,
      cacheKey: "part",
      value: "updated",
    }),
  )
  expect(
    await Effect.runPromise(
      readLocalCacheEffect({ cacheEngine: asynchronous, cacheKey: "part" }),
    ),
  ).toBe("updated")
  await Effect.runPromise(
    removeLocalCacheEffect({ cacheEngine: asynchronous, cacheKey: "part" }),
  )
  expect(values.size).toBe(0)
  expect(runCoreSync(readLocalCacheEffect({ cacheKey: "missing" }))).toBeNull()
  const original = new Error("cache offline")
  const failure = readLocalCacheEffect({
    cacheKey: "part",
    cacheEngine: {
      ...synchronous,
      getItem: () => {
        throw original
      },
    },
  })
  let caught: unknown
  try {
    await runCorePromise(failure)
  } catch (error) {
    caught = error
  }
  expect(caught).toBe(original)
  // A pending external cache cannot be stopped, but its Effect wait is interruptible.
  const controller = new AbortController()
  const waiting = Effect.runPromise(
    corePromise(() => new Promise<string>(() => {})),
    { signal: controller.signal },
  )
  controller.abort()
  await expect(waiting).rejects.toBeDefined()
})
