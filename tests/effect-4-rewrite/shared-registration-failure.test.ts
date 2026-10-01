import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { corePromise, originalCoreError } from "lib/effect/core-error"
import {
  SharedRenderRegistry,
  sharedRenderEffect,
} from "lib/effect/shared-render"

test("failed parent-finalizer registration releases an already acquired shared worker", async () => {
  const registry = new SharedRenderRegistry()
  const pending = new Map<string, Promise<AnyCircuitElement[]>>()
  const cause = new Error("parent closed while acquiring")
  let released = 0
  const exit = await Effect.runPromiseExit(
    sharedRenderEffect({
      registry,
      request: {
        propHash: "registration-failure",
        pendingSubcircuitRenders: pending,
        render: () =>
          Effect.scoped(
            Effect.gen(function* () {
              yield* Effect.acquireRelease(Effect.void, () =>
                Effect.sync(() => {
                  released++
                }),
              )
              return yield* corePromise<AnyCircuitElement[]>(
                () => new Promise(() => {}),
              )
            }),
          ),
      },
      addFinalizer: () => {
        throw cause
      },
    }),
  )
  expect(Exit.isFailure(exit)).toBe(true)
  if (Exit.isFailure(exit)) expect(originalCoreError(exit.cause)).toBe(cause)
  expect(released).toBe(1)
  expect(pending.size).toBe(0)
})
