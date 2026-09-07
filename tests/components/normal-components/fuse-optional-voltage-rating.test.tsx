import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fuse labels omit an absent voltage rating and preserve explicit ratings", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <fuse name="F1" currentRating="1A" schX={-4} schY={2} />
      <fuse
        name="F2"
        currentRating="500mA"
        voltageRating="24V"
        schX={4}
        schY={2}
      />
      <fuse name="F3" currentRating={2} voltageRating={0} schX={-4} schY={-2} />
      <fuse
        name="F4"
        currentRating="1A"
        schShowRatings={false}
        schX={4}
        schY={-2}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_component.getWhere({ name: "F1" })).toMatchObject({
    current_rating_amps: 1,
    display_current_rating: "1A",
    display_voltage_rating: undefined,
  })
  expect(
    circuit.db.source_component.getWhere({ name: "F1" }),
  ).not.toHaveProperty("voltage_rating_volts")
  expect(circuit.db.source_component.getWhere({ name: "F2" })).toMatchObject({
    current_rating_amps: 0.5,
    voltage_rating_volts: 24,
    display_current_rating: "500mA",
    display_voltage_rating: "24V",
  })
  expect(circuit.db.source_component.getWhere({ name: "F3" })).toMatchObject({
    voltage_rating_volts: 0,
    display_voltage_rating: "0V",
  })
  expect(circuit.db.source_component.getWhere({ name: "F4" })).toMatchObject({
    display_current_rating: undefined,
    display_voltage_rating: undefined,
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
