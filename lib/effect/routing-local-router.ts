import * as Effect from "effect/Effect"
import { CoreError, corePromise, coreSync } from "./core-error"
import type { CoreJobContext } from "./core-services"
import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
} from "../utils/autorouting/GenericLocalAutorouter"
import type { SimplifiedPcbTrace } from "../utils/autorouting/SimpleRouteJson"

/** Factories are a public Promise/value adapter. A legacy factory has no abort
 * parameter; a router arriving after interruption is nevertheless reclaimed.
 * Each acquisition has its own idempotent release, including reused routers.
 */
export function acquireLocalAutorouter(request: {
  job: CoreJobContext
  create: () => GenericLocalAutorouter | PromiseLike<GenericLocalAutorouter>
}) {
  return Effect.acquireRelease(
    corePromise(
      (signal) =>
        Promise.resolve(request.create()).then((autorouter) => {
          let released = false
          const resource = {
            autorouter,
            release() {
              if (released) return
              released = true
              autorouter.stop()
            },
          }
          if (signal.aborted || !request.job.isCurrent()) resource.release()
          return resource
        }),
      "create_autorouter",
    ),
    (resource) => Effect.sync(() => resource.release()),
    { interruptible: true },
  ).pipe(Effect.map((resource) => resource.autorouter))
}

/** Owns one router's listeners and scheduled solver work for every exit path.
 * External legacy routers may omit removeListener; their callbacks are then
 * disabled on release and stop() remains the resource cancellation boundary.
 */
export function runLocalAutorouter(
  autorouter: GenericLocalAutorouter,
  context: {
    job: CoreJobContext
    onProgress: (event: AutorouterProgressEvent) => void
    /** A stage scope may own stopping after reading the solver output. */
    stopOnRelease?: boolean
  },
) {
  return Effect.acquireUseRelease(
    coreSync(() => {
      let active = true
      let complete: (event: AutorouterCompleteEvent) => void = () => {}
      let error: (event: AutorouterErrorEvent) => void = () => {}
      let progress: (event: AutorouterProgressEvent) => void = () => {}
      return {
        register(
          resume: (
            result: Effect.Effect<SimplifiedPcbTrace[], CoreError>,
          ) => void,
        ) {
          complete = (event) => {
            if (active && context.job.isCurrent())
              // Promise-based routers previously resumed after all observers.
              queueMicrotask(() => resume(Effect.succeed(event.traces)))
          }
          error = (event) => {
            if (active && context.job.isCurrent())
              queueMicrotask(() =>
                resume(Effect.fail(new CoreError(event.error, "autorouting"))),
              )
          }
          progress = (event) => {
            if (!active) return
            try {
              context.job.commit(() => context.onProgress(event))
            } catch (cause) {
              resume(Effect.fail(new CoreError(cause, "autorouting_progress")))
            }
          }
          autorouter.on("complete", complete)
          autorouter.on("error", error)
          autorouter.on("progress", progress)
          if (context.job.isCurrent()) autorouter.start()
          else resume(Effect.interrupt)
        },
        release() {
          if (!active) return
          active = false
          let failed = false
          let releaseFailure: unknown
          for (const release of [
            () => autorouter.removeListener?.("complete", complete),
            () => autorouter.removeListener?.("error", error),
            () => autorouter.removeListener?.("progress", progress),
            () =>
              context.stopOnRelease === false ? undefined : autorouter.stop(),
          ]) {
            try {
              release()
            } catch (cause) {
              if (!failed) releaseFailure = cause
              failed = true
            }
          }
          if (failed) throw releaseFailure
        },
      }
    }, "acquire_autorouter"),
    (resource) =>
      Effect.callback<SimplifiedPcbTrace[], CoreError>((resume) => {
        try {
          resource.register(resume)
        } catch (cause) {
          resume(Effect.fail(new CoreError(cause, "start_autorouter")))
        }
      }),
    (resource) => Effect.sync(() => resource.release()),
  )
}
