import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ensure pcbPositionAnchor aligns component by specified NinePointAnchor

test("pcbPositionAnchor with NinePointAnchor", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <resistor
      name="R1"
      resistance="1k"
      footprint="0402"
      pcbX={10}
      pcbY={20}
      pcbPositionAnchor="top_left"
    />,
  )

  circuit.render()

  const pcbComponent = circuit.db.pcb_component.list()[0]

  // PCB is Y-up, so the top edge is the max Y of the component
  expect(pcbComponent.center.x - pcbComponent.width / 2).toBeCloseTo(10)
  expect(pcbComponent.center.y + pcbComponent.height / 2).toBeCloseTo(20)
})
