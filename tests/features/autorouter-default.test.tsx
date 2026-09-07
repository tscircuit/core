import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test('autorouter="default" uses the default local autorouter', async () => {
  const { circuit } = getTestFixture()
  let solverStartedEvent: SolverStartedEvent | undefined
  circuit.on("solver:started", (event) => {
    solverStartedEvent = event
  })

  circuit.add(
    <board width="12mm" height="8mm" autorouter="default">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={3} />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      <pcbnotetext
        text={'autorouter="default" route'}
        fontSize={0.5}
        pcbX={0}
        pcbY={-2.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(solverStartedEvent?.solverName).toBe(
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
