import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Group } from "lib/components/primitive-components/Group/Group"
import { ControlledAutorouter } from "./routing-fixture"

test("removing a subcircuit stops its routing while its parent remains usable", async () => {
  const circuit = new RootCircuit()
  const router = new ControlledAutorouter()
  let signalStarted!: () => void
  const started = new Promise<void>((resolve) => {
    signalStarted = resolve
  })
  router.onStart = signalStarted
  circuit.add(
    <board width={20} height={10}>
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
  const settling = circuit.renderUntilSettled()
  await started
  const board = circuit._getBoard()!
  const group = board.children.find(
    (child): child is Group => child instanceof Group,
  )!
  const lateComplete = router.completeHandlers[0]
  board.remove(group)
  await Promise.resolve()
  await Promise.resolve()
  lateComplete?.({ type: "complete", traces: [] })
  await settling
  expect(router.stops).toBe(1)
  expect(router.listenersRemoved).toBe(3)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  expect(circuit.effectRuntime.isDisposed).toBe(false)
  expect(group._asyncAutoroutingResult).toBeNull()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  await circuit.dispose()
})
