import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
test("insert trace error when trace goes out of board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="1mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-3}
        pcbX={-3}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </board>,
  )

  await circuit.render()
  const circuitJson = circuit.getCircuitJson()
  const pcbTraceErrors = circuitJson.filter(
    (el) => el.type === "pcb_trace_error",
  )
  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
  expect(pcbTraceErrors.length).toBe(1)
})
