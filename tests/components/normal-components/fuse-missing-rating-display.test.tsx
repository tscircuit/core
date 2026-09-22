import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fuse omits missing ratings from the schematic display value", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <fuse name="F1" currentRating="1A" voltageRating="32V" />
      <fuse name="F2" currentRating="1A" />
      <fuse
        name="F3"
        currentRating="1A"
        voltageRating="32V"
        schShowRatings={false}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComps = circuit
    .getCircuitJson()
    .filter((e: any) => e.type === "source_component")
  const byName = Object.fromEntries(
    sourceComps.map((c: any) => [c.name, c]),
  ) as any

  expect(byName.F1.display_current_rating).toBe("1A")
  expect(byName.F1.display_voltage_rating).toBe("32V")
  expect(byName.F2.display_current_rating).toBe("1A")
  expect(byName.F2.display_voltage_rating).toBeUndefined()
  expect(byName.F3.display_current_rating).toBeUndefined()
  expect(byName.F3.display_voltage_rating).toBeUndefined()

  const schematicComps = circuit
    .getCircuitJson()
    .filter((e: any) => e.type === "schematic_component")
  const displayValues = schematicComps.map((c: any) => c.symbol_display_value)

  expect(displayValues).toContain("1A / 32V")
  expect(displayValues).toContain("1A")
  expect(displayValues).not.toContain("1A / V")
})
