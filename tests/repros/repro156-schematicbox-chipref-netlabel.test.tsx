import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const chipSelector = ".U1"
const powerSheetName = "U1 Power"
const chipSectionWidth = 2.245
const chipSectionHeight = 1

const powerPinLabels = {
  pin7: "VCC",
  pin8: "GND",
}

const allPinLabels = {
  pin1: "D0",
  pin2: "D1",
  pin3: "D2",
  pin4: "D3",
  pin5: "D4",
  pin6: "D5",
  pin7: "VCC",
  pin8: "GND",
}

test("repro156: schematicbox chipRef pins connect to a netlabel", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        footprint="soic8"
        schX={0}
        schY={2}
        name="U1"
        pinLabels={allPinLabels}
      />

      <schematicbox
        schX={6}
        schY={2}
        name="U1A"
        chipRef={chipSelector}
        width={chipSectionWidth}
        height={chipSectionHeight}
        pinLabels={powerPinLabels}
        schPinArrangement={{
          leftSide: ["GND", "VCC"],
          rightSide: [],
        }}
      />

      <netlabel schX={3} schY={2} net="GND" connectsTo="U1.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
