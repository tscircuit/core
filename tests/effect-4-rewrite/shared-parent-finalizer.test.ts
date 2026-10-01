import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { corePromise } from "lib/effect/core-error"
import {
  SharedRenderRegistry,
  sharedRenderEffect,
} from "lib/effect/shared-render"
import type { AnyCircuitElement } from "circuit-json"

test("parent scope finalizers release their leases and scoped completion unregisters them", async () => {
  const finalizers = new Set<() => PromiseLike<void> | void>()
  let released = 0
  const registry = new SharedRenderRegistry()
  const request = {
    propHash: "parent-subcircuit",
    render: () =>
      corePromise<AnyCircuitElement[]>((signal) => {
        signal.addEventListener("abort", () => {
          released++
        })
        return new Promise(() => {})
      }),
  }
  const consumer = Effect.runPromiseExit(
    sharedRenderEffect({
      registry,
      request,
      addFinalizer: (finalizer) => {
        finalizers.add(finalizer)
        return () => {
          finalizers.delete(finalizer)
        }
      },
    }),
  )
  expect(finalizers.size).toBe(1)
  await Promise.all([...finalizers].map((finalizer) => finalizer()))
  await consumer
  expect(released).toBe(1)
  expect(finalizers.size).toBe(0)
})
