import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A fuse rated in milliamps (a very common part, e.g. a 500mA / 250V fuse)
// used to be mis-parsed: parseFloat("500mA") dropped the SI prefix and emitted
// current_rating_amps: 500 (500 A) instead of 0.5 A, a 1000x error, and the
// schematic label read "500A" instead of "500mA".
test("<fuse /> parses SI-prefixed current and voltage ratings", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fuse
        name="F1"
        currentRating="500mA"
        voltageRating="250V"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const sourceComponent = circuitJson.find(
    (c: any) => c.type === "source_component" && c.ftype === "simple_fuse",
  ) as any

  expect(sourceComponent.current_rating_amps).toBe(0.5)
  expect(sourceComponent.voltage_rating_volts).toBe(250)
  expect(sourceComponent.display_current_rating).toBe("500mA")
  expect(sourceComponent.display_voltage_rating).toBe("250V")

  const schematicComponent = circuitJson.find(
    (c: any) => c.type === "schematic_component",
  ) as any
  expect(schematicComponent.symbol_display_value).toBe("500mA / 250V")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
