import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { ControlledAutorouter } from "./routing-fixture"

test("disposing a circuit interrupts its live routing stage and suppresses late events", async () => {
  const circuit = new RootCircuit()
  const router = new ControlledAutorouter()
  let signalStarted!: () => void
  const started = new Promise<void>((resolve) => {
    signalStarted = resolve
  })
  router.onStart = signalStarted
  const progress: unknown[] = []
  circuit.on("autorouting:progress", (event) => progress.push(event))
  circuit.add(
    <board
      width={20}
      height={10}
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: async () => router,
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <trace from="R1.1" to="R2.1" />
    </board>,
  )
  const settling = circuit.renderUntilSettled().catch(() => {})
  await started
  const lateComplete = router.completeHandlers[0]
  const lateProgress = router.progressHandlers[0]
  expect(circuit.effectRuntime.activeJobCount).toBe(1)
  await circuit.dispose()
  await settling
  lateComplete?.({ type: "complete", traces: [] })
  lateProgress?.({ type: "progress", progress: 1, steps: 100 })
  expect(router.starts).toBe(1)
  expect(router.stops).toBe(1)
  expect(router.listenersRemoved).toBe(3)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  expect(progress).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
})
