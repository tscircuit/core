import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import * as Effect from "effect/Effect"
import { corePromise } from "lib/effect/core-error"
import { SharedRenderRegistry } from "lib/effect/shared-render"

test("worker cleanup failure remains visible when releasing the final shared lease", async () => {
  const registry = new SharedRenderRegistry()
  const cause = new Error("child cleanup failed")
  const lease = registry.acquire({
    propHash: "cleanup-failure",
    render: () =>
      Effect.scoped(
        Effect.gen(function* () {
          yield* Effect.acquireRelease(Effect.void, () => Effect.die(cause))
          return yield* corePromise<AnyCircuitElement[]>(
            () => new Promise(() => {}),
          )
        }),
      ),
  })
  const rejected = await lease.release().then(
    () => undefined,
    (error) => error,
  )
  expect(rejected).toBe(cause)
})
