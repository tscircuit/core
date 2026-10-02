import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ICS_43434 } from "tests/fixtures/ics43434-import/C5656610"

test("local autorouting connects an imported polygon composite pin", async () => {
  const { circuit } = getTestFixture()
  const startedSolvers: string[] = []
  circuit.on("solver:started", (event) => {
    startedSolvers.push(event.solverName)
  })
  circuit.add(
    <board width={12} height={9} autorouter={{ local: true }}>
      <ICS_43434 name="MIC1" pcbX={1.25} pcbY={-1.5} schX={-2} />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3.5}
        pcbY={-1}
        schX={2}
      />
      <trace from=".MIC1 > .GND" to=".R1 > .pin1" />
      <pcbnotetext
        text="C5656610: GND connected by the local autorouter"
        pcbX={0}
        pcbY={3.5}
        fontSize={0.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(startedSolvers.some((name) => name.startsWith("Autorouting"))).toBe(
    true,
  )
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_missing_error.list()).toHaveLength(0)
  const sourceTrace = circuit.db.source_trace.list()[0]!
  const routedTraces = circuit.db.pcb_trace
    .list()
    .filter((trace) => trace.source_trace_id === sourceTrace.source_trace_id)
  expect(routedTraces.length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
