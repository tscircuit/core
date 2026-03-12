import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc reports invalid property when primitive component-relative refs are used inside footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor name="R1" footprint="0402" resistance="1k" pcbX="8mm" />
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="0.5mm"
              pcbX="calc(R1.maxX + 1mm)"
              pcbY="calc(R1.y)"
            />
          </footprint>
        }
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
    "Invalid pcbX value for SmtPad: component-relative calc references are not supported for footprint elements (SmtPad); pcbX will be ignored. expression="calc(R1.maxX + 1mm)"
    Invalid pcbY value for SmtPad: component-relative calc references are not supported for footprint elements (SmtPad); pcbY will be ignored. expression="calc(R1.y)""
  `)

  expect(
    invalidPropertyErrors.some(
      (element) =>
        "property_name" in element && element.property_name === "pcbX",
    ),
  ).toBe(true)
})
