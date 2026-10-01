import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { RootCircuit } from "lib/RootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { corePromise } from "lib/effect/core-error"
import { attachRenderChild, flushRenderJobs } from "./render-helpers"

class StandaloneActor extends Renderable {
  root: RootCircuit | null = null

  constructor() {
    super({})
    this._currentRenderPhase = "SourceRender"
  }
}

function queueScopedJob(actor: StandaloneActor, owner: Renderable = actor) {
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  const resource = {
    active: 0,
    cleanup: 0,
    writes: 0,
    signal: undefined as AbortSignal | undefined,
    transportSignal: undefined as AbortSignal | undefined,
    release,
  }
  actor._queueEffect("standalone-resource", {
    owner,
    build: (job) =>
      Effect.gen(function* () {
        resource.signal = job.signal
        yield* Effect.acquireRelease(
          Effect.sync(() => resource.active++),
          () =>
            Effect.sync(() => {
              resource.active--
              resource.cleanup++
            }),
        )
        yield* corePromise((signal) => {
          resource.transportSignal = signal
          return pending
        })
        yield* Effect.sync(() => job.commit(() => resource.writes++))
      }),
  })
  expect(resource.active).toBe(1)
  expect(resource.signal?.aborted).toBe(false)
  expect(resource.transportSignal?.aborted).toBe(false)
  return resource
}

test("standalone cancellation reaches existing ancestor, descendant and circuit scopes without creating a runtime", async () => {
  const virgin = new StandaloneActor()
  virgin.cancelPendingEffects()
  expect(Reflect.get(virgin, "_standaloneEffectRuntime")).toBeUndefined()

  const removed = new StandaloneActor()
  const removedJob = queueScopedJob(removed)
  removed.shouldBeRemoved = true
  removed.runRenderPhase("SourceRender")

  const subtree = new StandaloneActor()
  const child = new StandaloneActor()
  attachRenderChild(subtree, child)
  const childJob = queueScopedJob(child)
  subtree.cancelPendingEffects()
  expect(Reflect.get(subtree, "_standaloneEffectRuntime")).toBeUndefined()

  const invoker = new StandaloneActor()
  const logicalOwner = new StandaloneActor()
  attachRenderChild(invoker, logicalOwner)
  const logicalJob = queueScopedJob(invoker, logicalOwner)
  logicalOwner.cancelPendingEffects()
  expect(Reflect.get(logicalOwner, "_standaloneEffectRuntime")).toBeUndefined()

  const circuit = new RootCircuit()
  const attached = new StandaloneActor()
  const standaloneJob = queueScopedJob(attached)
  attached.root = circuit
  const circuitJob = queueScopedJob(attached)
  expect(circuit.effectRuntime.activeJobCount).toBe(1)
  attached.cancelPendingEffects()

  for (const actor of [removed, subtree, invoker, attached]) {
    await flushRenderJobs(actor)
    expect(actor.getPendingAsyncEffectNames()).toEqual([])
  }
  for (const actor of [removed, child, invoker, attached]) {
    const runtime = Reflect.get(actor, "_standaloneEffectRuntime")
    expect(runtime).toBeInstanceOf(CircuitRuntime)
    if (!(runtime instanceof CircuitRuntime)) throw new Error("Missing runtime")
    expect(runtime.activeJobCount).toBe(0)
  }
  expect(child.getPendingAsyncEffectNames()).toEqual([])
  expect(circuit.effectRuntime.activeJobCount).toBe(0)

  const resources = [
    removedJob,
    childJob,
    logicalJob,
    standaloneJob,
    circuitJob,
  ]
  for (const resource of resources) {
    expect(resource.signal?.aborted).toBe(true)
    expect(resource.transportSignal?.aborted).toBe(true)
    expect(resource.active).toBe(0)
    expect(resource.cleanup).toBe(1)
    expect(resource.writes).toBe(0)
    resource.release()
  }
  for (let continuation = 0; continuation < 20; continuation++)
    await Promise.resolve()
  for (const resource of resources) {
    expect(resource.cleanup).toBe(1)
    expect(resource.writes).toBe(0)
  }
  await circuit.dispose()
})
