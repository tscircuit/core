import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { corePromise } from "lib/effect/core-error"
import {
  SharedRenderRegistry,
  sharedRenderEffect,
} from "lib/effect/shared-render"
import type { AnyCircuitElement } from "circuit-json"

test("the final shared consumer interrupts and awaits worker resource cleanup", async () => {
  const registry = new SharedRenderRegistry()
  const pending = new Map<string, Promise<AnyCircuitElement[]>>()
  const cache = new Map<string, AnyCircuitElement[]>()
  let aborted = 0
  let released = 0
  const controller = new AbortController()
  const consumer = Effect.runPromiseExit(
    sharedRenderEffect({
      registry,
      request: {
        propHash: "orphaned-subcircuit",
        pendingSubcircuitRenders: pending,
        cachedSubcircuits: cache,
        render: () =>
          Effect.scoped(
            Effect.gen(function* () {
              yield* Effect.acquireRelease(Effect.void, () =>
                Effect.sync(() => {
                  released++
                }),
              )
              return yield* corePromise<AnyCircuitElement[]>((signal) => {
                signal.addEventListener("abort", () => {
                  aborted++
                })
                return new Promise(() => {})
              })
            }),
          ),
      },
    }),
    { signal: controller.signal },
  )
  controller.abort()
  await consumer
  expect(aborted).toBe(1)
  expect(released).toBe(1)
  expect(pending.size).toBe(0)
  expect(cache.size).toBe(0)
})
