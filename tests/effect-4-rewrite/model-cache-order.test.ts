import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { runCorePromise, runCoreSync } from "lib/effect/core-error"
import {
  readLocalCacheEffect,
  writeLocalCacheEffect,
} from "lib/local-cache-engine"

test("configured synchronous cache engines preserve the legacy await boundary", async () => {
  const order: string[] = []
  const cacheEngine = {
    getItem: () => {
      order.push("read")
      return null
    },
    setItem: () => {
      order.push("write")
    },
  }
  const read = runCorePromise(
    Effect.gen(function* () {
      yield* readLocalCacheEffect({ cacheEngine, cacheKey: "part" })
      order.push("after_read")
    }),
  )
  expect(order).toEqual(["read"])
  await read
  expect(order).toEqual(["read", "after_read"])
  const write = runCorePromise(
    Effect.gen(function* () {
      yield* writeLocalCacheEffect({
        cacheEngine,
        cacheKey: "part",
        value: "cached",
      })
      order.push("after_write")
    }),
  )
  expect(order).toEqual(["read", "after_read", "write"])
  await write
  expect(order).toEqual(["read", "after_read", "write", "after_write"])
  runCoreSync(
    Effect.gen(function* () {
      yield* readLocalCacheEffect({ cacheKey: "missing_engine" })
      yield* writeLocalCacheEffect({
        cacheKey: "missing_engine",
        value: "ignored",
      })
      order.push("no_engine")
    }),
  )
  expect(order.at(-1)).toBe("no_engine")
})
