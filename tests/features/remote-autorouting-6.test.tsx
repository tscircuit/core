import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"
import { su } from "@tscircuit/soup-util"

test("remote-autorouter-6 using group subcircuit", async () => {
  if (process.env.CI) return
  const { circuit } = getTestFixture()

  // Create a basic circuit that needs routing
  circuit.add(
    <group subcircuit autorouter="auto-cloud">
      <resistor name="R1" pcbX={0} pcbY={0} resistance={100} footprint="0402" />
      <resistor name="R2" pcbX={2} pcbY={0} resistance={100} footprint="0402" />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </group>,
  )

  await circuit.renderUntilSettled()

  const pcb_component = su(circuit.getCircuitJson())
    .pcb_component.list()
    .filter((c) => c.pcb_component_id === "pcb_component_0")
  expect(pcb_component[0].center.x).toBe(0)
  expect(pcb_component[0].center.y).toBe(0)

  expect(pcb_component[0].width.toFixed(2)).toBe("1.60")
  expect(pcb_component[0].height.toFixed(2)).toBe("0.60")
})
