import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<fuse /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fuse
        name="F1"
        currentRating="10"
        voltageRating="220"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("<fuse /> omits the voltage half of the label when voltageRating is absent", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="10mm" routingDisabled>
      <fuse name="F1" currentRating="1A" footprint="0402" schX={-4} />
      <fuse
        name="F2"
        currentRating="2A"
        voltageRating="32V"
        footprint="0402"
        schX={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sourceByName = Object.fromEntries(
    circuitJson
      .filter((e: any) => e.type === "source_component")
      .map((e: any) => [e.name, e]),
  )
  const symbolValues = circuitJson
    .filter((e: any) => e.type === "schematic_component")
    .map((e: any) => e.symbol_display_value)
    .filter(Boolean)
    .sort()

  // `voltageRating` is optional, so a fuse without one should not render a bare
  // unit — this used to produce "1A / V" on the schematic and "V" in source.
  expect(sourceByName.F1.display_current_rating).toBe("1A")
  expect(sourceByName.F1.display_voltage_rating).toBeUndefined()

  // A fuse that does declare one is unchanged.
  expect(sourceByName.F2.display_current_rating).toBe("2A")
  expect(sourceByName.F2.display_voltage_rating).toBe("32V")

  expect(symbolValues).toEqual(["1A", "2A / 32V"])
})
