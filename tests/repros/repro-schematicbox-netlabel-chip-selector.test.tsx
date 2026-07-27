import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const chipName = "U1"
const chipSelector = `.workaround .${chipName}`
const chipSectionWidth = 2.245
const chipSectionHeight = 1

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

const powerPinLabels = {
  pin7: "VCC",
  pin8: "GND",
}

test("netlabel selector targets chip represented by schematicbox", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <subcircuit name="workaround">
        <chip
          footprint="soic8"
          schX={0}
          schY={2}
          name="U1"
          pinLabels={allPinLabels}
        />
      </subcircuit>

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

      {/* Undefined behavior: should the netlabel connect to U1 or U1A? */}
      <netlabel schX={3} schY={2} net="GND" connectsTo="U1.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
