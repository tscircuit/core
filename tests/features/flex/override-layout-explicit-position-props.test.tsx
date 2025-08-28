import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbComponent } from "circuit-json"

it("autoLayout position should be overridden by pcbX and pcbY props", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbFlex>
      <resistor name="R1" footprint={"0402"} resistance={100} pcbX={-5} />
      <resistor name="R2" footprint={"0402"} resistance={100} />
    </board>,
  )

  circuit.render()

  const pcb_component_R1 = circuit
    .getCircuitJson()
    .filter(
      (el) =>
        el.type === "pcb_component" &&
        el.source_component_id === "source_component_0",
    )[0] as PcbComponent

  expect(pcb_component_R1.center).toMatchInlineSnapshot(`
    {
      "x": -5,
      "y": 0,
    }
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
