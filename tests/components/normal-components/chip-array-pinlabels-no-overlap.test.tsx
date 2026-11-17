import { expect, test } from "bun:test"
import { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
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

  await circuit.renderUntilSettled()

  const schematicComponent = circuit.db.schematic_component.list()[0]
  expect(schematicComponent.size.width).toBeGreaterThan(1.8)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("array pinLabels size 4-sided box height and width like displayed string labels", () => {
  const pinCount = 16
  const arrayPinLabels: Record<string, readonly string[]> = {}
  const stringPinLabels: Record<string, string> = {}
  for (let pinNumber = 1; pinNumber <= pinCount; pinNumber++) {
    const label = `LONG_PIN_LABEL_${pinNumber}`
    arrayPinLabels[`pin${pinNumber}`] = [label]
    stringPinLabels[`pin${pinNumber}`] = label
  }

  const schPortArrangement = {
    leftSize: 4,
    rightSize: 4,
    topSize: 4,
    bottomSize: 4,
  }

  const arraySize = getAllDimensionsForSchematicBox({
    schPinSpacing: 0.2,
    pinCount,
    schPortArrangement,
    pinLabels: arrayPinLabels,
  }).getSize()
  const stringSize = getAllDimensionsForSchematicBox({
    schPinSpacing: 0.2,
    pinCount,
    schPortArrangement,
    pinLabels: stringPinLabels,
  }).getSize()

  expect(arraySize.width).toBe(stringSize.width)
  expect(arraySize.height).toBe(stringSize.height)
  expect(arraySize.width).toBeGreaterThan(1.8)
  expect(arraySize.height).toBeGreaterThan(1.8)
})
