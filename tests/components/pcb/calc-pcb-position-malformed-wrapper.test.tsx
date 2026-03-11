import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc rejects missing closing paren in calc wrapper for normal component", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX="calc(board.minX + 1mm"
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

  expect(message).toContain("Invalid pcbX value")

  expect(
    invalidPropertyErrors.some(
      (element) =>
        "property_name" in element && element.property_name === "pcbX",
    ),
  ).toBe(true)
})

test("pcb calc rejects malformed calc wrapper token for normal component", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX="calc board.minX + 1mm)"
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

  expect(message).toContain("Invalid pcbX value")

  expect(
    invalidPropertyErrors.some(
      (element) =>
        "property_name" in element && element.property_name === "pcbX",
    ),
  ).toBe(true)
})

test("pcb calc reports invalid inner calc expression for normal component", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX="calc(board.minX + )"
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

  expect(message).toContain("Invalid pcbX value")
  expect(message).toContain("Unexpected end of expression")
  expect(message).toContain('expression="calc(board.minX + )"')

  expect(
    invalidPropertyErrors.some(
      (element) =>
        "property_name" in element && element.property_name === "pcbX",
    ),
  ).toBe(true)
})
