import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// tscircuit/schematic-viewer#246 — imported chips pass pinLabels as alias arrays
test("dense chip with array pinLabels keeps opposite-side labels from overlapping", async () => {
  const { circuit } = getTestFixture()

  const pinLabels: Record<string, readonly string[]> = {}
  for (let pinNumber = 1; pinNumber <= 56; pinNumber++) {
    pinLabels[`pin${pinNumber}`] = [pinNumber <= 28 ? "IOVDD6" : "GPIO26_ADC0"]
  }

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" pinLabels={pinLabels} />
    </board>,
  )

  circuit.render()

  const schematicComponent = circuit.db.schematic_component.list()[0]
  expect(schematicComponent.size.width).toBeGreaterThan(2)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
