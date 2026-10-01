import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { CoreError, runCorePromise } from "lib/effect/core-error"

test("operation and cleanup failures retain both original thrown values", async () => {
  const original = Object.freeze({ reason: "operation failed" })
  const cleanup = Symbol("cleanup failed")
  const program = Effect.scoped(
    Effect.gen(function* () {
      yield* Effect.addFinalizer(() => Effect.die(cleanup))
      yield* Effect.fail(new CoreError(original, "test_operation"))
    }),
  )
  const failure = await runCorePromise(program).catch((error: unknown) => error)
  expect(failure).toBeInstanceOf(AggregateError)
  if (failure instanceof AggregateError) {
    expect(failure.errors).toEqual([original, cleanup])
    expect(failure.cause).toBe(original)
  }
})
