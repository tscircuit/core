import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import { originalCoreError } from "./core-error"

/**
 * Baseline job try/catch blocks covered both rejected callbacks and thrown
 * domain work. Effect generators classify the latter as defects, so recorders
 * must handle both Fail and Die. Any interruption propagates unchanged.
 *
 * The caller retains its original catch boundary and recovery/rethrow policy,
 * and records through job.commit. A recorder describes the first failure,
 * matching the baseline catch before cleanup. The complete cause is supplied
 * separately for rethrow, retaining every operation and cleanup failure.
 */
export function catchJobFailure<A, E, R, B, E2, R2>(
  program: Effect.Effect<A, E, R>,
  handle: (
    original: unknown,
    cause: Cause.Cause<E>,
  ) => Effect.Effect<B, E2, R2>,
): Effect.Effect<A | B, E | E2, R | R2> {
  return Effect.catchCause(program, (cause): Effect.Effect<B, E | E2, R2> => {
    if (Cause.hasInterrupts(cause)) return Effect.failCause(cause)
    const recordedCause =
      cause.reasons.length > 1 ? Cause.fromReasons([cause.reasons[0]]) : cause
    return handle(originalCoreError(recordedCause), cause)
  })
}
