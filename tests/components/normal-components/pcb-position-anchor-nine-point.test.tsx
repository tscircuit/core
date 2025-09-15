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

  const resistor = circuit.selectOne(".R1")
  const bounds = resistor!._getPcbCircuitJsonBounds().bounds

  expect(bounds.left).toBeCloseTo(10)
  expect(bounds.top).toBeCloseTo(20)
})
