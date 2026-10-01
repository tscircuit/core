import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { corePromise } from "lib/effect/core-error"
import {
  SharedRenderRegistry,
  sharedRenderEffect,
} from "lib/effect/shared-render"
import type { AnyCircuitElement } from "circuit-json"

test("cancelling one shared consumer preserves a worker another consumer needs", async () => {
  const registry = new SharedRenderRegistry()
  const pending = new Map<string, Promise<AnyCircuitElement[]>>()
  const cache = new Map<string, AnyCircuitElement[]>()
  const completion = Promise.withResolvers<AnyCircuitElement[]>()
  let started = 0
  let workerAborted = false
  const request = {
    propHash: "same-subcircuit",
    pendingSubcircuitRenders: pending,
    cachedSubcircuits: cache,
    render: () =>
      corePromise((signal) => {
        started++
        signal.addEventListener("abort", () => {
          workerAborted = true
        })
        return completion.promise
      }),
  }
  const firstAbort = new AbortController()
  const first = Effect.runPromiseExit(
    sharedRenderEffect({ registry, request }),
    { signal: firstAbort.signal },
  )
  const second = Effect.runPromiseExit(
    sharedRenderEffect({ registry, request }),
  )
  firstAbort.abort()
  expect(Exit.isFailure(await first)).toBe(true)
  expect(workerAborted).toBe(false)
  expect(started).toBe(1)
  expect(pending.size).toBe(1)
  const json: AnyCircuitElement[] = []
  completion.resolve(json)
  const secondExit = await second
  expect(Exit.isSuccess(secondExit)).toBe(true)
  if (Exit.isSuccess(secondExit)) expect(secondExit.value).toBe(json)
  expect(cache.get("same-subcircuit")).toBe(json)
  expect(pending.size).toBe(0)
})
