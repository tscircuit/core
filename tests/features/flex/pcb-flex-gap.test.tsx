import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import type { PcbComponent } from "circuit-json"

test("pcb flex gap", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group pcbFlex pcbFlexGap="3mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
    </group>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const pcb_component_r1 = circuitJson.filter(
    (c) =>
      c.type === "pcb_component" && c.pcb_component_id === "pcb_component_0",
  ) as PcbComponent[]
  const pcb_component_c1 = circuitJson.filter(
    (c) =>
      c.type === "pcb_component" && c.pcb_component_id === "pcb_component_1",
  ) as PcbComponent[]

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(pcb_component_r1[0].center).toMatchInlineSnapshot(`
    {
      "x": -2.3,
      "y": 0,
    }
  `)
  expect(pcb_component_c1[0].center).toMatchInlineSnapshot(`
    {
      "x": 2.3,
      "y": 0,
    }
  `)
})
