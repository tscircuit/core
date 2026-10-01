import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { coreSync, runCorePromise, runCoreSync } from "lib/effect/core-error"

test("public boundaries retain every original operation and cleanup value while preserving single failures", async () => {
  const operationFailure = Symbol("operation_failure")
  const cleanupFailure = Object.freeze({ failure: "cleanup_failure" })
  const operation = coreSync(() => {
    throw operationFailure
  })
  const cleanup = Effect.orDie(
    coreSync(() => {
      throw cleanupFailure
    }),
  )
  const compound = operation.pipe(Effect.ensuring(cleanup))
  let single: unknown
  try {
    runCoreSync(operation)
  } catch (failure) {
    single = failure
  }
  expect(single).toBe(operationFailure)
  let synchronous: unknown
  try {
    runCoreSync(compound)
  } catch (failure) {
    synchronous = failure
  }
  expect(synchronous).toBeInstanceOf(AggregateError)
  if (!(synchronous instanceof AggregateError))
    throw new Error("Missing compound error")
  expect(synchronous.errors).toEqual([operationFailure, cleanupFailure])
  expect(synchronous.errors[0]).toBe(operationFailure)
  expect(synchronous.errors[1]).toBe(cleanupFailure)
  let asynchronous: unknown
  try {
    await runCorePromise(compound)
  } catch (failure) {
    asynchronous = failure
  }
  expect(asynchronous).toBeInstanceOf(AggregateError)
  if (!(asynchronous instanceof AggregateError))
    throw new Error("Missing compound error")
  expect(asynchronous.errors).toEqual([operationFailure, cleanupFailure])
  expect(asynchronous.errors[0]).toBe(operationFailure)
  expect(asynchronous.errors[1]).toBe(cleanupFailure)
})
