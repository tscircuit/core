import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { Renderable } from "lib/components/base-components/Renderable"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { corePromise } from "lib/effect/core-error"
import type { CoreJobCancellationReason } from "lib/effect/core-services"

class CancellationOwner extends Renderable {}

test("delayed cleanup sees disposal after an earlier generation cancellation without repeating policy callbacks", async () => {
  const runtime = new CircuitRuntime(() => ({ fetch }))
  const owner = new CancellationOwner({})
  let releaseCleanup!: () => void
  let cleanupStarted!: () => void
  const started = new Promise<void>((resolve) => {
    cleanupStarted = resolve
  })
  const cleanup = new Promise<void>((resolve) => {
    releaseCleanup = resolve
  })
  const observedReasons: (CoreJobCancellationReason | undefined)[] = []
  const cancellations: CoreJobCancellationReason[] = []
  const completion = runtime.queue({
    owner,
    policy: {
      onCancel: (reason) => {
        cancellations.push(reason)
      },
    },
    build: (job) =>
      Effect.gen(function* () {
        yield* Effect.acquireRelease(Effect.void, () =>
          Effect.gen(function* () {
            cleanupStarted()
            yield* corePromise(() => cleanup)
            observedReasons.push(job.cancellationReason)
          }).pipe(Effect.orDie),
        )
        yield* corePromise(() => new Promise<void>(() => {}))
      }),
  })
  runtime.cancelSubtree(owner, { reason: "superseded" })
  await started
  const disposal = runtime.dispose()
  releaseCleanup()
  await Promise.all([completion, disposal])
  expect(cancellations).toEqual(["superseded"])
  expect(observedReasons).toEqual(["disposed"])
  expect(runtime.activeJobCount).toBe(0)
})
