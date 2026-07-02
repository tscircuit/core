import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbStraightLine with fewer than two connected ports inserts a pcb_trace_error instead of crashing the render", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <trace from=".R1 > .pin1" to="net.GND" pcbStraightLine thickness={0.3} />
    </board>,
  )

  // Should not throw / abort the entire render
  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()

  const pcbTraceErrors = circuitJson.filter(
    (element: any) => element.type === "pcb_trace_error",
  ) as any[]

  expect(pcbTraceErrors).toHaveLength(1)
  expect(pcbTraceErrors[0].message).toBe(
    "pcbStraightLine requires exactly two connected ports",
  )

  // The render completed: the board and source component still exist
  expect(
    circuitJson.some((element: any) => element.type === "source_component"),
  ).toBe(true)
})
