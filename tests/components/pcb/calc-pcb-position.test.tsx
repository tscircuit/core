import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * These tests ensure pcbX/pcbY support calc(...) expressions with board variables.
 */
test("pcb coordinates can use calc expressions with board bounds", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX="calc(board.minX + 1mm)"
        pcbY="calc(board.maxY - 1mm)"
      />
    </board>,
  )

  circuit.render()

  // Inspect generated PCB components
  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents.length).toBeGreaterThan(0)
  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors.length).toBe(0)

  const resistor = pcbComponents[0]
  expect(resistor?.center.x).toBeCloseTo(-9)
  expect(resistor?.center.y).toBeCloseTo(4)
})

test("legacy lowercase board bounds in calc expressions remain supported", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX="calc(board.minx + 1mm)"
        pcbY="calc(board.maxy - 1mm)"
      />
    </board>,
  )

  circuit.render()

  const resistor = circuit.db.pcb_component.list()[0]
  expect(resistor?.center.x).toBeCloseTo(-9)
  expect(resistor?.center.y).toBeCloseTo(4)
})

test("calc expressions using board bounds fail for auto-sized boards", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX="calc(board.minX + 1mm)"
      />
    </board>,
  )

  try {
    circuit.render()
    throw new Error("render should have thrown")
  } catch (error) {
    expect((error as Error).message).toContain(
      "Cannot do calculations based on board size when the board is auto-sized",
    )
  }
})
