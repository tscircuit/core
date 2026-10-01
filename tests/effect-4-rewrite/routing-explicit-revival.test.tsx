import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Group } from "lib/components/primitive-components/Group/Group"
import { ControlledAutorouter } from "./routing-fixture"

test("an explicitly revived Group routes a new generation and rejects old completion", async () => {
  const circuit = new RootCircuit()
  const firstRouter = new ControlledAutorouter()
  const secondRouter = new ControlledAutorouter()
  let signalFirst!: () => void
  let signalSecond!: () => void
  const firstStarted = new Promise<void>((resolve) => {
    signalFirst = resolve
  })
  const secondStarted = new Promise<void>((resolve) => {
    signalSecond = resolve
  })
  firstRouter.onStart = signalFirst
  secondRouter.onStart = signalSecond
  let calls = 0
  const algorithmFn = async () => (++calls === 1 ? firstRouter : secondRouter)
  circuit.add(
    <board width={20} height={10}>
      <group
        name="routing_scope"
        subcircuit
        autorouter={{ local: true, groupMode: "subcircuit", algorithmFn }}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
        <trace from="R1.1" to="R2.1" />
      </group>
    </board>,
  )
  const settling = circuit.renderUntilSettled()
  await firstStarted
  const board = circuit._getBoard()!
  const group = board.children.find(
    (child): child is Group => child instanceof Group,
  )!
  const props = group._parsedProps
  const oldComplete = firstRouter.completeHandlers[0]
  board.remove(group)
  expect(group._hasStartedAsyncAutorouting).toBe(false)
  // Existing add() does not revive removal state. Preserve that public contract.
  group.shouldBeRemoved = false
  board.add(group)
  await secondStarted
  expect(group._hasStartedAsyncAutorouting).toBe(true)
  oldComplete?.({ type: "complete", traces: [] })
  expect(group._asyncAutoroutingResult).toBeNull()
  expect(group._hasStartedAsyncAutorouting).toBe(true)
  secondRouter.complete()
  await settling
  const completedResult = group._asyncAutoroutingResult
  expect(completedResult).toMatchObject({ output_pcb_traces: [] })
  expect(calls).toBe(2)
  expect(firstRouter.stops).toBe(1)
  expect(secondRouter.stops).toBe(1)
  expect(group._parsedProps).toBe(props)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)

  // Reviving an already completed generation preserves its result/config.
  board.remove(group)
  group.shouldBeRemoved = false
  board.add(group)
  group._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()
  expect(calls).toBe(2)
  expect(group._asyncAutoroutingResult).toBe(completedResult)
  expect(group._hasStartedAsyncAutorouting).toBe(true)
  await circuit.dispose()
})
