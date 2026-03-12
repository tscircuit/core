import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("validate pcb coordinates reports original edge property name", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbLeftEdgeX="calc board.minX + 1mm)"
      />
    </board>,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  const message = invalidPropertyErrors
    .filter((element) => "message" in element)
    .map((element) => element.message)
    .join("\n")
  expect(message).toMatchInlineSnapshot(
    `"Invalid pcbLeftEdgeX value for Resistor: Invalid calc() expression. expression="calc board.minX + 1mm)""`,
  )

  expect(
    invalidPropertyErrors.some(
      (element) =>
        "property_name" in element && element.property_name === "pcbLeftEdgeX",
    ),
  ).toBe(true)
})
