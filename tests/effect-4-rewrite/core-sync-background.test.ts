import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Cause from "effect/Cause"
import { corePromise, runCoreSync } from "lib/effect/core-error"

test("a rejected synchronous boundary interrupts its asynchronous continuation", async () => {
  let release!: () => void
  let signal!: AbortSignal
  let writes = 0
  let releases = 0
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  const program = Effect.scoped(
    Effect.gen(function* () {
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          releases++
        }),
      )
      yield* corePromise((abortSignal) => {
        signal = abortSignal
        return pending
      })
      writes++
    }),
  )
  let failure: unknown
  try {
    runCoreSync(program)
  } catch (caught) {
    failure = caught
  }
  expect(Cause.isAsyncFiberError(failure)).toBe(true)
  expect(signal.aborted).toBe(true)
  release()
  for (let turn = 0; turn < 20; turn++) await Promise.resolve()
  expect(writes).toBe(0)
  expect(releases).toBe(1)
})
