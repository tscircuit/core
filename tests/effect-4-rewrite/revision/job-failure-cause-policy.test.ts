import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { CoreError, originalCoreError } from "lib/effect/core-error"
import { catchJobFailure } from "lib/effect/job-failure"

test("job recorders see original Fail and Die values, preserve all rethrown reasons, and ignore interruption", () => {
  const firstFailure = new Error("primary failure")
  const cleanupFailure = new Error("cleanup failure")
  const originals = [firstFailure, "rejected string", undefined]
  for (const original of originals) {
    for (const cause of [
      Cause.fail(new CoreError(original)),
      Cause.die(original),
    ]) {
      const recorded: unknown[] = []
      const exit = Effect.runSyncExit(
        catchJobFailure(Effect.failCause(cause), (failure, fullCause) => {
          recorded.push(failure)
          return Effect.failCause(fullCause)
        }),
      )
      expect(recorded).toEqual([original])
      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit))
        expect(originalCoreError(exit.cause)).toBe(original)
    }
  }

  const compound = Cause.combine(
    Cause.fail(new CoreError(firstFailure)),
    Cause.die(cleanupFailure),
  )
  const recorded: unknown[] = []
  const compoundExit = Effect.runSyncExit(
    catchJobFailure(Effect.failCause(compound), (failure, cause) => {
      recorded.push(failure)
      return Effect.failCause(cause)
    }),
  )
  expect(recorded).toEqual([firstFailure])
  expect(Exit.isFailure(compoundExit)).toBe(true)
  if (Exit.isFailure(compoundExit)) {
    const failure = originalCoreError(compoundExit.cause)
    expect(failure).toBeInstanceOf(AggregateError)
    if (failure instanceof AggregateError)
      expect(failure.errors).toEqual([firstFailure, cleanupFailure])
  }

  for (const cause of [
    Cause.interrupt(42),
    Cause.combine(compound, Cause.interrupt(42)),
  ]) {
    let recordings = 0
    const exit = Effect.runSyncExit(
      catchJobFailure(Effect.failCause(cause), () => {
        recordings++
        return Effect.void
      }),
    )
    expect(recordings).toBe(0)
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) expect(exit.cause).toEqual(cause)
  }
})
