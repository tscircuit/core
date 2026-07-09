import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro147: pinheader schFacingDirection down", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="10mm">
      <pinheader
        name="J1"
        pinCount={8}
        gender="male"
        pitch="2.54mm"
        footprint="pinrow8_rows2"
        doubleRow={true}
        showSilkscreenPinLabels={true}
        pinLabels={["VCC", "GND", "SDA", "SCL", "MISO", "MOSI", "SCK", "CS"]}
        pcbX={0}
        pcbY={0}
        schHeight={1}
        schFacingDirection="down"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
