import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { Renderable } from "lib/components/base-components/Renderable"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { corePromise } from "lib/effect/core-error"

class RuntimeOwner extends Renderable {}

test("disposal interrupts ignored promises, awaits resource cleanup, and stays idempotent", async () => {
  const runtime = new CircuitRuntime(() => ({ fetch }))
  const owner = new RuntimeOwner({})
  let release!: () => void
  let writes = 0
  let finalizers = 0
  let jobSignal!: AbortSignal
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  const completion = runtime.queue({
    owner,
    build: (job) =>
      Effect.gen(function* () {
        jobSignal = job.signal
        yield* Effect.acquireRelease(Effect.void, () =>
          Effect.sync(() => {
            finalizers++
          }),
        )
        yield* corePromise(() => pending)
        job.commit(() => {
          writes++
        })
      }),
  })
  const disposal = runtime.dispose()
  expect(runtime.dispose()).toBe(disposal)
  expect(jobSignal.aborted).toBe(true)
  await disposal
  await completion
  expect(finalizers).toBe(1)
  expect(runtime.activeJobCount).toBe(0)
  release()
  for (let turn = 0; turn < 20; turn++) await Promise.resolve()
  expect(writes).toBe(0)
  await runtime.queue({
    owner,
    build: () =>
      Effect.sync(() => {
        writes++
      }),
  })
  expect(writes).toBe(0)
})
