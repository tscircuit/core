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

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(invalidPropertyErrors.length).toBeGreaterThan(0)

  const message = invalidPropertyErrors
    .filter((element) => "message" in element)
    .map((element) => element.message)
    .join("\n")
  expect(message).toMatchInlineSnapshot(
    `"Invalid pcbX value for Resistor: Cannot do calculations based on board size when the board is auto-sized. expression="calc(board.minX + 1mm)""`,
  )
})

test("calc expressions on edge props fail for auto-sized boards", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbLeftEdgeX="calc(board.minX + 1mm)"
        pcbTopEdgeY="calc(board.maxY - 1mm)"
      />
    </board>,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(invalidPropertyErrors.length).toBeGreaterThan(0)

  const message = invalidPropertyErrors
    .filter((element) => "message" in element)
    .map((element) => element.message)
    .join("\n")
  expect(message).toMatchInlineSnapshot(`
    "Invalid pcbLeftEdgeX value for Resistor: Cannot do calculations based on board size when the board is auto-sized. expression="calc(board.minX + 1mm)"
    Invalid pcbTopEdgeY value for Resistor: Cannot do calculations based on board size when the board is auto-sized. expression="calc(board.maxY - 1mm)""
  `)
})

test("calc expressions using board bounds without a board report no-board error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <resistor
      name="R1"
      footprint="0402"
      resistance="1k"
      pcbX="calc(board.minX + 1mm)"
    />,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(invalidPropertyErrors.length).toBeGreaterThan(0)

  const message = invalidPropertyErrors
    .filter((element) => "message" in element)
    .map((element) => element.message)
    .join("\n")
  expect(message).toMatchInlineSnapshot(
    `"Invalid pcbX value for Resistor: no board found for board.* variables. expression="calc(board.minX + 1mm)""`,
  )
})
