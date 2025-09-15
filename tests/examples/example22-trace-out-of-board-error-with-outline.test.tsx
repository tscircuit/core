import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
test("insert trace error when trace goes out of board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="1mm"
      height="10mm"
      autorouter={"sequential-trace"}
      outline={[
        { x: 0, y: 0 }, // Bottom-left
        { x: 10, y: 0 }, // Bottom-right
        { x: 12, y: 5 }, // Right peak
        { x: 5, y: 10 }, // Top peak
        { x: -2, y: 5 }, // Left peak
      ]}
    >
      <resistor resistance="1k" footprint="0402" name="R1" pcbY={5} pcbX={5} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        pcbY={1}
        pcbX={-2}
      />
      <resistor resistance="1k" footprint="0402" name="R2" pcbY={7} pcbX={5} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C2"
        pcbY={2}
        pcbX={2}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      <trace from=".R2 > .pin1" to=".C2 > .pin1" />
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
