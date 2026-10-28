import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("crystals omit frequency and load capacitance display fields", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board>
      <crystal name="Y1" frequency="40MHz" loadCapacitance="12pF" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const crystal = circuit.db.source_component
    .list()
    .find((sourceComponent) => sourceComponent.ftype === "simple_crystal")
  if (!crystal) throw new Error("Expected a simple_crystal source component")
  expect(crystal).toMatchObject({
    frequency: 40000000,
    load_capacitance: 1.2e-11,
  })
  expect(crystal).not.toHaveProperty("display_frequency")
  expect(crystal).not.toHaveProperty("display_load_capacitance")
})
