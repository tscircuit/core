import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { PreventSchedulerYield } from "effect/References"

export const coreErrorBrand = Symbol.for("tscircuit.core.operation_error")

export class CoreError extends Error {
  readonly _tag = "core_error"
  readonly [coreErrorBrand] = true
  constructor(
    cause: unknown,
    readonly operation = "core",
  ) {
    super(`Core operation failed: ${operation}`, { cause })
  }
}

export const coreSync = <A>(step: () => A, operation = "core") =>
  Effect.try({ try: step, catch: (cause) => new CoreError(cause, operation) })

export const corePromise = <A>(
  step: (signal: AbortSignal) => PromiseLike<A>,
  operation = "core",
) =>
  Effect.tryPromise({
    try: (signal) => {
      try {
        return Promise.resolve(step(signal))
      } catch (cause) {
        return Promise.reject(cause)
      }
    },
    catch: (cause) => new CoreError(cause, operation),
  })

export function originalCoreError(cause: Cause.Cause<unknown>) {
  const failures = cause.reasons.flatMap((reason) => {
    const failure = Cause.isFailReason(reason)
      ? reason.error
      : Cause.isDieReason(reason)
        ? reason.defect
        : undefined
    if (Cause.isInterruptReason(reason)) return []
    return [
      typeof failure === "object" &&
      failure !== null &&
      coreErrorBrand in failure &&
      "cause" in failure
        ? failure.cause
        : failure,
    ]
  })
  if (failures.length > 1) {
    return new AggregateError(failures, "Core operation and cleanup failed", {
      cause: failures[0],
    })
  }
  return failures.length ? failures[0] : Cause.squash(cause)
}

/** Public synchronous compatibility boundary, preserving thrown value identity. */
export function runCoreSync<A, E>(program: Effect.Effect<A, E>) {
  const exit = Effect.runSyncExit(
    Effect.provideService(program, PreventSchedulerYield, true),
  )
  if (Exit.isSuccess(exit)) return exit.value
  const failure = originalCoreError(exit.cause)
  // Effect 4 runSyncExit leaves an accidentally asynchronous fiber running.
  // Interrupt that continuation before exposing the synchronous failure.
  if (Cause.isAsyncFiberError(failure)) failure.fiber.interruptUnsafe()
  throw failure
}

/**
 * Model and render transitions keep the original synchronous call-stack boundary.
 * Defer interruption and scheduler yielding through each complete transaction.
 */
export function atomicCoreEffect<A, E, R>(program: Effect.Effect<A, E, R>) {
  return Effect.uninterruptible(
    Effect.withFiber((fiber) =>
      fiber.getRef(PreventSchedulerYield)
        ? program
        : Effect.provideService(program, PreventSchedulerYield, true),
    ),
  )
}

/** Public Promise boundary, preserving failure and caller-abort value identity. */
export function runCorePromise<A, E>(
  program: Effect.Effect<A, E>,
  options: { signal?: AbortSignal } = {},
): Promise<A> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(options.signal.reason)
      return
    }
    Effect.runCallback(program, {
      signal: options.signal,
      onExit: (exit) => {
        if (Exit.isSuccess(exit)) resolve(exit.value)
        else if (
          Cause.hasInterruptsOnly(exit.cause) &&
          options.signal?.aborted
        ) {
          reject(options.signal.reason)
        } else reject(originalCoreError(exit.cause))
      },
    })
  })
}
