import { expect, test } from "bun:test"
import { Group } from "lib/components/primitive-components/Group/Group"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ControlledAutorouter } from "../routing-fixture"

test("supplementary: terminal routing cancellation clears its guard without dirty writes", async () => {
  const terminalObservations: Array<{
    reason: "removed" | "disposed"
    startedAfterCancellation: boolean
    dirtyWrites: string[]
  }> = []

  for (const reason of ["removed", "disposed"] as const) {
    const { circuit } = getTestFixture({
      platform: { drcChecksDisabled: true },
    })
    const router = new ControlledAutorouter()
    let signalStarted!: () => void
    const started = new Promise<void>((resolve) => {
      signalStarted = resolve
    })
    router.onStart = signalStarted
    circuit.add(
      <board width={20} height={10} partsEngineDisabled>
        <group
          name="routing_scope"
          subcircuit
          autorouter={{
            local: true,
            groupMode: "subcircuit",
            algorithmFn: async () => router,
          }}
        >
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
          <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
          <trace from="R1.1" to="R2.1" />
        </group>
      </board>,
    )

    // Stop this caller's wait independently, leaving the routing job live.
    // Cancellation of the circuit must not need a subsequent render traversal.
    const waitController = new AbortController()
    const settling = circuit.renderUntilSettled({
      signal: waitController.signal,
    })
    await started
    const waitCancelled = new Error("test caller stopped waiting")
    waitController.abort(waitCancelled)
    await expect(settling).rejects.toBe(waitCancelled)

    const board = circuit._getBoard()!
    const group = board.children.find(
      (child): child is Group => child instanceof Group,
    )!
    expect(group._hasStartedAsyncAutorouting).toBe(true)
    expect(circuit.effectRuntime.activeJobCount).toBe(1)

    // This is deliberately supplementary internal-state coverage. Track writes
    // to the existing state objects, including writes that bypass _markDirty.
    const dirtyWrites: string[] = []
    for (const [phase, state] of Object.entries(group.renderPhaseStates)) {
      let dirty = state.dirty
      Object.defineProperty(state, "dirty", {
        enumerable: true,
        configurable: true,
        get: () => dirty,
        set: (value: boolean) => {
          if (value) dirtyWrites.push(phase)
          dirty = value
        },
      })
    }

    const lateComplete = router.completeHandlers[0]!
    const lateProgress = router.progressHandlers[0]!
    const lateError = router.errorHandlers[0]!
    const progressEvents: unknown[] = []
    circuit.on("autorouting:progress", (event) => progressEvents.push(event))
    const routingEnded = new Promise<void>((resolve) => {
      circuit.on("asyncEffect:end", (event) => {
        if (event.effectName === "autorouting") resolve()
      })
    })

    if (reason === "removed") board.remove(group)
    else await circuit.dispose()
    const startedAfterCancellation = group._hasStartedAsyncAutorouting
    const jsonAfterCancellation = structuredClone(circuit.db.toArray())
    await routingEnded

    // Retained external callbacks must be harmless after scope release.
    lateComplete({ type: "complete", traces: [] })
    lateProgress({ type: "progress", progress: 1, steps: 100 })
    lateError({ type: "error", error: new Error("late routing error") })
    await Promise.resolve()
    await Promise.resolve()

    expect(circuit.db.toArray()).toEqual(jsonAfterCancellation)
    expect(group._asyncAutoroutingResult).toBeNull()
    expect(progressEvents).toEqual([])
    expect(router.stops).toBe(1)
    expect(router.listenersRemoved).toBe(3)
    expect(circuit.effectRuntime.activeJobCount).toBe(0)
    if (reason === "removed") await circuit.dispose()

    terminalObservations.push({
      reason,
      startedAfterCancellation,
      dirtyWrites,
    })
  }

  expect(terminalObservations).toEqual([
    { reason: "removed", startedAfterCancellation: false, dirtyWrites: [] },
    { reason: "disposed", startedAfterCancellation: false, dirtyWrites: [] },
  ])
})
