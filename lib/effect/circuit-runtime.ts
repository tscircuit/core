import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Layer from "effect/Layer"
import * as ManagedRuntime from "effect/ManagedRuntime"
import * as Scope from "effect/Scope"
import { PreventSchedulerYield } from "effect/References"
import type { Renderable } from "../components/base-components/Renderable"
import { originalCoreError } from "./core-error"
import {
  CircuitEnvironment,
  CoreJobScope,
  type CircuitEnvironmentShape,
  type CoreJobContext,
  type CoreJobServices,
} from "./core-services"

export class CircuitDisposedError extends Error {
  readonly _tag = "circuit_disposed"
  constructor() {
    super("This circuit has been disposed")
  }
}

interface OwnedJob {
  readonly controller: AbortController
  readonly completion: Promise<void>
  readonly ancestry: readonly Renderable[]
}

/** One managed service layer and interruptible job scopes per circuit. */
export class CircuitRuntime {
  private readonly managed: ManagedRuntime.ManagedRuntime<
    CircuitEnvironment,
    never
  >
  private readonly jobsByOwner = new Map<Renderable, Set<OwnedJob>>()
  private readonly finalizers = new Set<() => PromiseLike<void> | void>()
  private disposed = false
  private disposal?: Promise<void>
  private readonly cleanupFailures: unknown[] = []

  constructor(environment: () => CircuitEnvironmentShape) {
    this.managed = ManagedRuntime.make(
      Layer.succeed(CircuitEnvironment)({
        get db() {
          return environment().db
        },
        get platform() {
          return environment().platform
        },
        fetch: (url, options) => environment().fetch(url, options),
      }),
    )
    Effect.runSync(
      Scope.addFinalizer(
        this.managed.scope,
        Effect.promise(async () => {
          const finalizers = Array.from(this.finalizers).reverse()
          this.finalizers.clear()
          const outcomes = await Promise.allSettled(
            finalizers.map((finalize) => Promise.resolve().then(finalize)),
          )
          const failures = outcomes.flatMap((outcome) =>
            outcome.status === "rejected" ? [outcome.reason] : [],
          )
          this.cleanupFailures.push(...failures)
        }),
      ),
    )
  }

  get isDisposed() {
    return this.disposed
  }
  get activeJobCount() {
    let count = 0
    for (const jobs of this.jobsByOwner.values()) count += jobs.size
    return count
  }

  hasActiveJobs(owner: Renderable) {
    return (this.jobsByOwner.get(owner)?.size ?? 0) > 0
  }

  assertOpen() {
    if (this.disposed) throw new CircuitDisposedError()
  }

  runSync<A, E>(program: Effect.Effect<A, E, CircuitEnvironment>): A {
    this.assertOpen()
    const exit = this.managed.runSyncExit(
      Effect.provideService(program, PreventSchedulerYield, true),
    )
    if (Exit.isSuccess(exit)) return exit.value
    const failure = originalCoreError(exit.cause)
    if (Cause.isAsyncFiberError(failure)) failure.fiber.interruptUnsafe()
    throw failure
  }

  queue(request: {
    owner: Renderable
    build: (
      job: CoreJobContext,
    ) => Effect.Effect<void, unknown, CoreJobServices>
  }): Promise<void> {
    if (this.disposed) return Promise.resolve()
    const { owner } = request
    const controller = new AbortController()
    const ancestry: Renderable[] = []
    for (
      let ancestor: Renderable | null = owner;
      ancestor;
      ancestor = ancestor.parent
    )
      ancestry.push(ancestor)
    const context: CoreJobContext = {
      owner,
      signal: controller.signal,
      isCurrent: () => {
        if (this.disposed || controller.signal.aborted) return false
        let ancestorIndex = 0
        for (
          let ancestor: Renderable | null = owner;
          ancestor;
          ancestor = ancestor.parent
        ) {
          if (
            ancestor.shouldBeRemoved ||
            ancestor !== ancestry[ancestorIndex++]
          )
            return false
        }
        return ancestorIndex === ancestry.length
      },
      commit: (write) => (context.isCurrent() ? write() : undefined),
    }
    let resolve!: () => void
    let reject!: (failure: unknown) => void
    const completion = new Promise<void>((resolveJob, rejectJob) => {
      resolve = resolveJob
      reject = rejectJob
    })
    const ownedJob: OwnedJob = { controller, completion, ancestry }
    const ownerJobs = this.jobsByOwner.get(owner) ?? new Set<OwnedJob>()
    ownerJobs.add(ownedJob)
    this.jobsByOwner.set(owner, ownerJobs)
    const program = Effect.scoped(
      Effect.suspend(() =>
        Effect.provideService(request.build(context), CoreJobScope, context),
      ),
    )
    this.managed.runCallback(program, {
      signal: controller.signal,
      onExit: (exit) => {
        ownerJobs.delete(ownedJob)
        if (!ownerJobs.size) this.jobsByOwner.delete(owner)
        if (Exit.isSuccess(exit) || Cause.hasInterruptsOnly(exit.cause))
          resolve()
        else reject(originalCoreError(exit.cause))
      },
    })
    return completion
  }

  cancelSubtree(component: Renderable) {
    for (const [owner, jobs] of this.jobsByOwner) {
      let ancestor: Renderable | null = owner
      while (ancestor && ancestor !== component) ancestor = ancestor.parent
      for (const job of jobs) {
        if (ancestor === component || job.ancestry.includes(component))
          job.controller.abort()
      }
    }
  }

  /** Register root-owned resources; completed consumer leases may unregister. */
  addFinalizer(finalize: () => PromiseLike<void> | void): () => void {
    this.assertOpen()
    this.finalizers.add(finalize)
    return () => {
      this.finalizers.delete(finalize)
    }
  }

  dispose(): Promise<void> {
    if (this.disposal) return this.disposal
    this.disposed = true
    let resolveDisposal!: () => void
    let rejectDisposal!: (failure: unknown) => void
    this.disposal = new Promise<void>((resolve, reject) => {
      resolveDisposal = resolve
      rejectDisposal = reject
    })
    const jobs = Array.from(this.jobsByOwner.values()).flatMap((ownerJobs) =>
      Array.from(ownerJobs),
    )
    for (const job of jobs) job.controller.abort()
    void (async () => {
      const outcomes = await Promise.allSettled(
        jobs.map((job) => job.completion),
      )
      const failures = outcomes.flatMap((outcome) =>
        outcome.status === "rejected" ? [outcome.reason] : [],
      )
      try {
        await new Promise<void>((resolve, reject) =>
          Effect.runCallback(this.managed.disposeEffect, {
            onExit: (exit) =>
              Exit.isSuccess(exit)
                ? resolve()
                : reject(originalCoreError(exit.cause)),
          }),
        )
      } catch (failure) {
        failures.push(failure)
      }
      failures.push(...this.cleanupFailures)
      if (failures.length)
        throw new AggregateError(failures, "Circuit disposal failed")
    })().then(resolveDisposal, rejectDisposal)
    return this.disposal
  }
}
