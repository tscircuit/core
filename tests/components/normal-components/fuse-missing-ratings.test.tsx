import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression for https://github.com/tscircuit/core/issues/2833
test("<fuse /> without voltageRating omits the voltage segment", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fuse name="F1" currentRating="1A" footprint="0402" />
      <fuse name="F2" currentRating="1A" voltageRating="32V" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponents = circuit.db.source_component.list()
  const byName = Object.fromEntries(sourceComponents.map((c: any) => [c.name, c]))

  expect(byName.F1.display_current_rating).toBe("1A")
  expect(byName.F1.display_voltage_rating).toBeUndefined()
  expect(byName.F2.display_current_rating).toBe("1A")
  expect(byName.F2.display_voltage_rating).toBe("32V")

  const schematicComponents = circuit.db.schematic_component.list()
  const sourceIdToName = Object.fromEntries(
    sourceComponents.map((c: any) => [c.source_component_id, c.name]),
  )
  const displayValues = Object.fromEntries(
    schematicComponents.map((c: any) => [
      sourceIdToName[c.source_component_id],
      c.symbol_display_value,
    ]),
  )

  expect(displayValues.F1).toBe("1A")
  expect(displayValues.F2).toBe("1A / 32V")
})
