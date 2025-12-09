import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { test } from "bun:test"
import { expect } from "bun:test"

test("repro-11-hover-trace-with-new-autorouter", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="15mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        schX={-2}
      />
      <led name="LED1" footprint="0402" pcbX={3} schX={2} />
      <trace from="R1.pin1" to="LED1.anode" />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showErrorsInTextOverlay: true,
  })

  const pcb_traces = circuit.db.pcb_trace.list()
  expect(pcb_traces).toHaveLength(1)
  expect(pcb_traces[0].pcb_trace_id).toBeDefined()
  expect(pcb_traces[0].source_trace_id).toBeDefined()

  const source_trace = circuit.db.source_trace.list()
  expect(source_trace).toHaveLength(1)
  expect(source_trace[0].source_trace_id).toBeDefined()

  // To fix the hover trace, we need to ensure that the source_trace_id is
  // set on the pcb_trace
  //@ts-ignore
  expect(source_trace[0].source_trace_id).toBe(pcb_traces[0].source_trace_id)
})
