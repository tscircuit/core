import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import type { PrimitiveComponent } from "../../components/base-components/PrimitiveComponent"
import { corePromise } from "../../effect/core-error"
import type { CoreJobContext } from "../../effect/core-services"

export type FootprintFetch = (
  url: string,
  options: RequestInit,
) => Promise<Response>

export interface EffectFootprintLoadingOptions {
  /** Defaults to global fetch. The implementation must observe options.signal. */
  fetch?: FootprintFetch
  /** Additional attempts for network failures and HTTP 5xx; defaults to zero. */
  maxRetries?: number
}

interface FootprintLoadRequest {
  url: string
  isCurrent: () => boolean
  /** Existing importer conversion; creates detached children, never attaches. */
  decode: (response: Response) => Promise<PrimitiveComponent[]>
  commit: (footprintChildren: PrimitiveComponent[]) => void
  onError: (cause: unknown) => void
}

interface OwnedFootprintJob {
  controller: AbortController
  request: FootprintLoadRequest
  done: Promise<void>
}

/** Internal typed failure; the legacy Promise/event boundary keeps its cause. */
export class FootprintLoadError extends Error {
  readonly _tag = "footprint_load_error"

  constructor(
    cause: unknown,
    readonly retryable = false,
  ) {
    super("Footprint loading failed", { cause })
  }
}

function fetchFootprintChildren(
  request: FootprintLoadRequest,
  fetchFootprint: FootprintFetch,
) {
  return Effect.tryPromise({
    // Keep fetch AND body consumption inside this interruptible region. Ending
    // it after headers would leave response.json() outside signal ownership.
    try: async (signal) => {
      let response: Response
      try {
        response = await fetchFootprint(request.url, { signal })
      } catch (cause) {
        throw new FootprintLoadError(cause, true)
      }
      if (signal.aborted) {
        await response.body?.cancel().catch(() => {})
        throw new FootprintLoadError(signal.reason)
      }
      if (!response.ok) {
        // Release the unsuccessful response before retrying. A cleanup failure
        // must not replace the HTTP status error at the compatibility boundary.
        await response.body?.cancel().catch(() => {})
        throw new FootprintLoadError(
          new Error(`Failed to fetch footprint: ${response.status}`),
          response.status >= 500,
        )
      }
      try {
        return await request.decode(response)
      } catch (cause) {
        throw new FootprintLoadError(cause)
      }
    },
    catch: (cause) =>
      cause instanceof FootprintLoadError
        ? cause
        : new FootprintLoadError(cause),
  })
}

/**
 * Experimental ownership for raw HTTP Circuit JSON footprints only. Each job
 * owns its fetch/body signal; removal, replacement and disposal interrupt it.
 * A dependency that ignores abort may continue, but cannot commit a late result.
 * This is not whole-circuit disposal or ownership of parser/library/router jobs.
 */
export class EffectFootprintLoader {
  private readonly fetchFootprint: FootprintFetch
  private readonly maxRetries: number
  private readonly jobsByFootprintOwner = new Map<
    PrimitiveComponent,
    OwnedFootprintJob
  >()
  private disposed = false

  constructor(options: EffectFootprintLoadingOptions = {}) {
    this.fetchFootprint = options.fetch ?? ((url, init) => fetch(url, init))
    this.maxRetries = options.maxRetries ?? 0
    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0) {
      throw new RangeError("maxRetries must be a nonnegative integer")
    }
  }

  get activeJobCount() {
    return this.jobsByFootprintOwner.size
  }

  private canCommit(
    footprintOwner: PrimitiveComponent,
    job: OwnedFootprintJob,
  ) {
    if (
      this.disposed ||
      job.controller.signal.aborted ||
      this.jobsByFootprintOwner.get(footprintOwner) !== job ||
      footprintOwner.root?.experimentalFootprintLoader !== this ||
      !job.request.isCurrent()
    ) {
      return false
    }
    let ancestor: PrimitiveComponent | null = footprintOwner
    while (ancestor) {
      if (ancestor.shouldBeRemoved) return false
      ancestor = ancestor.parent
    }
    return true
  }

  private loadEffect(
    footprintOwner: PrimitiveComponent,
    job: OwnedFootprintJob,
  ) {
    return Effect.gen({ self: this }, function* () {
      const footprintChildren = yield* Effect.retry(
        fetchFootprintChildren(job.request, this.fetchFootprint),
        { times: this.maxRetries, while: (error) => error.retryable },
      )
      yield* Effect.try({
        try: () => {
          if (this.canCommit(footprintOwner, job)) {
            job.request.commit(footprintChildren)
          }
        },
        catch: (cause) => new FootprintLoadError(cause),
      })
    })
  }

  load(footprintOwner: PrimitiveComponent, request: FootprintLoadRequest) {
    if (this.disposed) return Promise.resolve()
    this.jobsByFootprintOwner.get(footprintOwner)?.controller.abort()
    const controller = new AbortController()
    let resolveJob!: () => void
    let rejectJob!: (cause: unknown) => void
    const done = new Promise<void>((resolve, reject) => {
      resolveJob = resolve
      rejectJob = reject
    })
    const job: OwnedFootprintJob = { controller, request, done }
    // Register before starting: runCallback can finish synchronously.
    this.jobsByFootprintOwner.set(footprintOwner, job)
    Effect.runCallback(this.loadEffect(footprintOwner, job), {
      signal: controller.signal,
      onExit: (exit) => {
        try {
          if (
            Exit.isSuccess(exit) ||
            Cause.hasInterrupts(exit.cause) ||
            !this.canCommit(footprintOwner, job)
          ) {
            // Cancellation settles the existing async-effect record without
            // logging an error or leaving renderUntilSettled waiting forever.
            resolveJob()
          } else {
            const failure = Cause.squash(exit.cause)
            const cause =
              failure instanceof FootprintLoadError ? failure.cause : failure
            request.onError(cause)
            rejectJob(cause)
          }
        } catch (cause) {
          rejectJob(cause)
        } finally {
          if (this.jobsByFootprintOwner.get(footprintOwner) === job) {
            this.jobsByFootprintOwner.delete(footprintOwner)
          }
        }
      },
    })
    return done
  }

  /** Compatibility options run beneath the circuit's owning job scope. */
  loadInScope(
    footprintOwner: PrimitiveComponent,
    { request, job }: { request: FootprintLoadRequest; job: CoreJobContext },
  ) {
    return corePromise(
      () =>
        this.load(footprintOwner, {
          ...request,
          isCurrent: () => job.isCurrent() && request.isCurrent(),
          commit: (children) => {
            job.commit(() => request.commit(children))
          },
          onError: (cause) => {
            job.commit(() => request.onError(cause))
          },
        }),
      "load_footprint_compatibility",
    ).pipe(
      Effect.onInterrupt(() =>
        Effect.sync(() => this.cancelSubtree(footprintOwner)),
      ),
    )
  }

  cancelSubtree(removedAncestor: PrimitiveComponent) {
    for (const [footprintOwner, job] of this.jobsByFootprintOwner) {
      let ancestor: PrimitiveComponent | null = footprintOwner
      while (ancestor) {
        if (ancestor === removedAncestor) {
          job.controller.abort()
          break
        }
        ancestor = ancestor.parent
      }
    }
  }

  async dispose() {
    this.disposed = true
    const jobs = [...this.jobsByFootprintOwner.values()]
    for (const job of jobs) job.controller.abort()
    await Promise.all(jobs.map((job) => job.done))
  }
}
