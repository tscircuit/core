import type { AnyCircuitElement } from "circuit-json"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { corePromise, coreSync, originalCoreError } from "./core-error"

/** Public compatibility key produced by getSubcircuitPropHash. */
export type SubcircuitPropHash = string
export type PendingSubcircuitRenders = Map<
  SubcircuitPropHash,
  Promise<AnyCircuitElement[]>
>
export type CachedSubcircuits = Map<SubcircuitPropHash, AnyCircuitElement[]>

// Consumer lookups use the public getter, which platforms may instrument.
// Generation checks inspect Map storage without counting an extra consumer.
const peekPendingSubcircuitRender: PendingSubcircuitRenders["get"] =
  Map.prototype.get

interface SharedRenderEntry {
  readonly promise: Promise<AnyCircuitElement[]>
  consumers: number
  finished: boolean
  exit?: Exit.Exit<AnyCircuitElement[], unknown>
  interrupt: () => void
}

export interface SharedRenderLease {
  readonly result: Promise<AnyCircuitElement[]>
  release(): Promise<void>
}

/**
 * A worker outlives individual consumers, but never the final consumer. Scoped
 * leases control worker interruption; public pending maps remain Promise maps.
 * No worker belongs to the first consumer's cancellable Promise continuation.
 */
export class SharedRenderRegistry {
  private readonly rendersByPropHash = new Map<
    SubcircuitPropHash,
    SharedRenderEntry
  >()

  acquire({
    propHash,
    pendingSubcircuitRenders,
    cachedSubcircuits,
    render,
  }: {
    propHash: SubcircuitPropHash
    pendingSubcircuitRenders?: PendingSubcircuitRenders
    cachedSubcircuits?: CachedSubcircuits
    render: () => Effect.Effect<AnyCircuitElement[], unknown>
  }): SharedRenderLease {
    const cached = cachedSubcircuits?.get(propHash)
    if (cached)
      return { result: Promise.resolve(cached), release: async () => {} }

    let entry = this.rendersByPropHash.get(propHash)
    const externalPending = pendingSubcircuitRenders?.get(propHash)
    // An externally replaced pending Promise owns its own cleanup policy.
    if (externalPending && externalPending !== entry?.promise) {
      return { result: externalPending, release: async () => {} }
    }

    if (entry) {
      entry.consumers++
    } else {
      let resolve!: (json: AnyCircuitElement[]) => void
      let reject!: (cause: unknown) => void
      const promise = new Promise<AnyCircuitElement[]>((accept, fail) => {
        resolve = accept
        reject = fail
      })
      // The compatibility map may have no other observers. Mark rejection as
      // handled while retaining the original rejecting Promise for consumers.
      void promise.catch(() => {})
      entry = {
        promise,
        consumers: 1,
        finished: false,
        interrupt: () => {},
      }
      this.rendersByPropHash.set(propHash, entry)
      pendingSubcircuitRenders?.set(propHash, promise)
      const worker = entry
      worker.interrupt = Effect.runCallback(Effect.suspend(render), {
        onExit: (exit) => {
          worker.exit = exit
          worker.finished = true
          const stillOwned = this.rendersByPropHash.get(propHash) === worker
          const ownsPending =
            !pendingSubcircuitRenders ||
            peekPendingSubcircuitRender.call(
              pendingSubcircuitRenders,
              propHash,
            ) === promise
          if (stillOwned) this.rendersByPropHash.delete(propHash)
          if (
            pendingSubcircuitRenders &&
            peekPendingSubcircuitRender.call(
              pendingSubcircuitRenders,
              propHash,
            ) === promise
          ) {
            pendingSubcircuitRenders.delete(propHash)
          }
          if (Exit.isSuccess(exit)) {
            if (stillOwned && ownsPending && worker.consumers > 0) {
              cachedSubcircuits?.set(propHash, exit.value)
            }
            resolve(exit.value)
          } else {
            reject(originalCoreError(exit.cause))
          }
        },
      })
    }

    const leasedRender = entry
    let releaseComplete: Promise<void> | undefined
    return {
      result: leasedRender.promise,
      release: () =>
        (releaseComplete ??= (async () => {
          leasedRender.consumers--
          if (leasedRender.consumers === 0 && !leasedRender.finished) {
            // Detach first so an interrupted worker cannot remove a replacement.
            if (this.rendersByPropHash.get(propHash) === leasedRender) {
              this.rendersByPropHash.delete(propHash)
            }
            if (
              pendingSubcircuitRenders &&
              peekPendingSubcircuitRender.call(
                pendingSubcircuitRenders,
                propHash,
              ) === leasedRender.promise
            ) {
              pendingSubcircuitRenders.delete(propHash)
            }
            leasedRender.interrupt()
            try {
              await leasedRender.promise
            } catch (cause) {
              if (
                leasedRender.exit &&
                Exit.isFailure(leasedRender.exit) &&
                !Cause.hasInterruptsOnly(leasedRender.exit.cause)
              )
                throw cause
            }
          }
        })()),
    }
  }
}

const sharedRenderRegistries = new WeakMap<object, SharedRenderRegistry>()

export function getSharedRenderRegistry(identity: object) {
  let registry = sharedRenderRegistries.get(identity)
  if (!registry) {
    registry = new SharedRenderRegistry()
    sharedRenderRegistries.set(identity, registry)
  }
  return registry
}

/** Acquire a lease in the consumer's Effect scope and release on every exit. */
export function sharedRenderEffect({
  registry,
  request,
  addFinalizer,
}: {
  registry: SharedRenderRegistry
  request: Parameters<SharedRenderRegistry["acquire"]>[0]
  addFinalizer?: (
    finalizer: () => PromiseLike<void> | void,
  ) => (() => void) | void
}) {
  return Effect.scoped(
    Effect.gen(function* () {
      let unregister: (() => void) | void
      const lease = yield* Effect.acquireRelease(
        coreSync(() => {
          return registry.acquire(request)
        }, "subcircuit:acquire-consumer"),
        (lease) =>
          Effect.promise(async () => {
            unregister?.()
            await lease.release()
          }),
      )
      yield* coreSync(() => {
        unregister = addFinalizer?.(lease.release)
      }, "subcircuit:register-parent-finalizer")
      return yield* corePromise(() => lease.result, "subcircuit:shared-render")
    }),
  )
}
