import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PlatformConfig } from "@tscircuit/props"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"
import type { Renderable } from "../components/base-components/Renderable"
import { corePromise, type CoreError } from "./core-error"

export type CoreJobCancellationReason =
  | "disposed"
  | "removed"
  | "reparented"
  | "props_changed"
  | "superseded"

/** Declared at a queue site; terminal cleanup is separate from render re-arm. */
export interface CoreJobCancellationPolicy {
  /** Omitted policy cancels. Extensions must explicitly release/re-arm guards. */
  readonly propsChange?: "cancel" | "finish"
  /** Finish only when the attachment boundary confirms the same circuit scope. */
  readonly reparentWithinCircuit?: "cancel" | "finish"
  /** Runs synchronously after abort. Terminal reasons must not schedule work. */
  readonly onCancel?: (reason: CoreJobCancellationReason) => void
}

export interface CoreJobContext {
  readonly owner: Renderable
  readonly signal: AbortSignal
  /** Internal reason; the external signal retains its native AbortError. */
  readonly cancellationReason?: CoreJobCancellationReason
  isCurrent(): boolean
  /** Execute a synchronous mutation only while this component job is current. */
  commit<A>(write: () => A): A | undefined
}

export class CoreJobScope extends Context.Service<
  CoreJobScope,
  CoreJobContext
>()("tscircuit/CoreJobScope") {}

export interface CircuitEnvironmentShape {
  readonly db?: CircuitJsonUtilObjects
  readonly platform?: PlatformConfig
  readonly fetch: (url: string, options?: RequestInit) => Promise<Response>
}

export class CircuitEnvironment extends Context.Service<
  CircuitEnvironment,
  CircuitEnvironmentShape
>()("tscircuit/CircuitEnvironment") {}

export type CoreServices = CircuitEnvironment | CoreJobScope
export type CoreJobServices = CoreServices | Scope.Scope
export type CoreEffect<A = void, E = CoreError> = Effect.Effect<
  A,
  E,
  CoreServices
>

/** Fetch and body consumers remain within the caller's Effect job scope. */
export function coreFetch(url: string, options?: RequestInit) {
  return Effect.gen(function* () {
    const environment = yield* CircuitEnvironment
    const job = yield* CoreJobScope
    return yield* Effect.acquireRelease(
      corePromise(async (signal) => {
        const requestSignal = AbortSignal.any([
          signal,
          job.signal,
          ...(options?.signal ? [options.signal] : []),
        ])
        const response = await environment.fetch(url, {
          ...options,
          signal: requestSignal,
        })
        if (requestSignal.aborted) {
          if (response.body && !response.bodyUsed && !response.body.locked)
            await response.body.cancel()
          throw requestSignal.reason
        }
        return response
      }, "fetch"),
      (response) =>
        corePromise(async () => {
          if (response.body && !response.bodyUsed && !response.body.locked)
            await response.body.cancel()
        }, "release_fetch_response").pipe(Effect.orDie),
      { interruptible: true },
    )
  })
}
