import { expect, test } from "bun:test"
import { CircuitRuntime } from "lib/effect/circuit-runtime"

test("disposal attempts every finalizer and retains each original cleanup failure", async () => {
  const runtime = new CircuitRuntime(() => ({ fetch }))
  const original = new Error("resource failed")
  const second = Symbol("another resource failed")
  let releases = 0
  runtime.addFinalizer(() => {
    releases++
    throw original
  })
  runtime.addFinalizer(() => {
    releases++
    return Promise.reject(second)
  })
  const failure = await runtime.dispose().catch((error: unknown) => error)
  expect(releases).toBe(2)
  expect(failure).toBeInstanceOf(AggregateError)
  if (failure instanceof AggregateError) {
    expect(failure.errors).toContain(original)
    expect(failure.errors).toContain(second)
  }
})
