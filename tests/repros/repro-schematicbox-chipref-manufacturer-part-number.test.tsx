import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicbox chipRef displays the chip manufacturer part number", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="U1"
        manufacturerPartNumber="STM32F030F4P6"
        footprint="soic8"
        noSchematicRepresentation
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
      />
      <schematicbox
        name="U1A"
        chipRef=".U1"
        width={2}
        height={1}
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        schPinArrangement={{ leftSide: ["GND"], rightSide: ["VCC"] }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
