import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { RootCircuit } from "lib/RootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"
import { corePromise, coreSync } from "lib/effect/core-error"
import { attachRenderChild, flushRenderJobs } from "./render-helpers"

class LogicalEventActor extends Renderable {
  constructor(readonly root: RootCircuit) {
    super({})
  }
}

class SimulationOwner extends Renderable {}

test("an owned child job cancels independently while retaining its invoking group's phase and display events", async () => {
  const circuit = new RootCircuit()
  const group = new LogicalEventActor(circuit)
  const simulation = new SimulationOwner({})
  attachRenderChild(group, simulation)
  const events: { event: string; display?: string; phase?: string }[] = []
  circuit.on("asyncEffect:start", (payload) =>
    events.push({
      event: "start",
      display: payload.componentDisplayName,
      phase: payload.phase,
    }),
  )
  circuit.on("asyncEffect:end", (payload) =>
    events.push({
      event: "end",
      display: payload.componentDisplayName,
      phase: payload.phase,
    }),
  )
  let release!: () => void
  let cleanupCount = 0
  let writes = 0
  group._currentRenderPhase = "SimulationSpiceEngineRender"
  group._queueEffect("simulation", {
    owner: simulation,
    build: (job) =>
      Effect.gen(function* () {
        expect(job.owner).toBe(simulation)
        yield* Effect.acquireRelease(Effect.void, () =>
          Effect.sync(() => {
            cleanupCount++
          }),
        )
        yield* corePromise(
          () =>
            new Promise<void>((resolve) => {
              release = resolve
            }),
        )
        yield* coreSync(() => {
          job.commit(() => {
            writes++
          })
        })
      }),
  })
  const pendingNames = group.getPendingAsyncEffectNames()
  expect(pendingNames).toEqual(["simulation"])
  expect(simulation.getPendingAsyncEffectNames()).toEqual([])
  expect(circuit.effectRuntime.activeJobCount).toBe(1)
  expect(
    circuit._hasIncompleteAsyncEffectsForPhase("SimulationSpiceEngineRender"),
  ).toBe(true)
  simulation.shouldBeRemoved = true
  circuit.effectRuntime.cancelSubtree(simulation)
  await flushRenderJobs(group)
  release()
  for (let continuation = 0; continuation < 10; continuation++)
    await Promise.resolve()
  expect(writes).toBe(0)
  expect(cleanupCount).toBe(1)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  expect(group.getPendingAsyncEffectNames()).toEqual([])
  expect(pendingNames).toEqual(["simulation"])
  expect(
    circuit._hasIncompleteAsyncEffectsForPhase("SimulationSpiceEngineRender"),
  ).toBe(false)
  expect(events).toEqual([
    {
      event: "start",
      display: "LogicalEventActor",
      phase: "SimulationSpiceEngineRender",
    },
    {
      event: "end",
      display: "LogicalEventActor",
      phase: "SimulationSpiceEngineRender",
    },
  ])
  await circuit.dispose()
})
