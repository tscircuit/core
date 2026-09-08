import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unparseable unit values are reported instead of rendering NaN", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="abc" footprint="0402" pcbX={-12} />
      <capacitor name="C1" capacitance="xyz" footprint="0402" pcbX={-6} />
      <fuse name="F1" currentRating="bad" footprint="0402" pcbX={6} />
      <resistor name="R9" resistance="1k" footprint="0402" pcbX={12} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_invalid_component_property_error.list()
  const byProperty = Object.fromEntries(
    errors.map((e) => [e.property_name, e.message]),
  )

  expect(Object.keys(byProperty).sort()).toEqual([
    "capacitance",
    "currentRating",
    "resistance",
  ])
  expect(byProperty.resistance).toContain('"abc"')
  expect(byProperty.resistance).toContain("R1")
  expect(byProperty.currentRating).toContain("F1")
  expect(errors).toHaveLength(3)
  expect(errors.some((e) => e.message.includes("R9"))).toBe(false)
})

test("valid values raise no property errors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={5} />
      <fuse name="F1" currentRating="2A" voltageRating="32V" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_invalid_component_property_error.list()).toEqual([])
})
