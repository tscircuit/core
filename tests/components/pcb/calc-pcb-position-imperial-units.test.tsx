import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc expressions support non-mm length units", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX="calc(board.minX + 100mil)"
        pcbY="calc(board.maxY - 0.1in)"
      />
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        pcbX="calc(board.maxX - 0.5cm)"
        pcbY="calc(board.minY + 500um)"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_invalid_component_property_error.list()).toEqual([])

  const [r1, r2] = circuit.db.pcb_component.list()
  expect(r1.center.x).toBeCloseTo(-10 + 2.54)
  expect(r1.center.y).toBeCloseTo(10 - 2.54)
  expect(r2.center.x).toBeCloseTo(10 - 5)
  expect(r2.center.y).toBeCloseTo(-10 + 0.5)
})
