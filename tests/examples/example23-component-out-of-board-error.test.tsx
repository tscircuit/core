import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
test("insert trace error when trace goes out of board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={7} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-3}
        pcbX={-3}
      />
    </board>,
  )

  await circuit.render()
  const circuitJson = circuit.getCircuitJson()
  const pcbTraceErrors = circuitJson.filter(
    (el) => el.type === "pcb_placement_error",
  )
  console.log("pcbTraceErrors", pcbTraceErrors)
  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
  expect(pcbTraceErrors).toMatchInlineSnapshot(
    `
  [
    {
      "message": "Component R1 out of board",
      "pcb_placement_error_id": "pcb_placement_error_0",
      "type": "pcb_placement_error",
    },
  ]
`,
  )
  expect(pcbTraceErrors.length).toBe(1)
})
