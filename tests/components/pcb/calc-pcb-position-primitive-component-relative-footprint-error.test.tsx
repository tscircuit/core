import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc reports invalid property when primitive component-relative refs are used inside footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor name="R1" footprint="0402" resistance="1k" pcbX="8mm" />
      <footprint>
        <via
          fromLayer="top"
          toLayer="bottom"
          pcbX="calc(R1.maxX + 1mm)"
          pcbY="calc(R1.y)"
        />
      </footprint>
    </board>,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_property_ignored_warning.list()

  expect(invalidPropertyErrors.length).toBeGreaterThan(0)

  const message = invalidPropertyErrors
    .filter((element) => "message" in element)
    .map((element) => element.message)
    .join("\n")
  expect(message).toContain(
    "component-relative calc references are not supported for footprint elements",
  )
  expect(message).toContain("Via")

  expect(
    invalidPropertyErrors.some(
      (element) =>
        "property_name" in element && element.property_name === "pcbX",
    ),
  ).toBe(true)
})
