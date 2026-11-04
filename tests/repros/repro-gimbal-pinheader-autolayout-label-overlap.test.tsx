import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("gimbal pinheader labels overlap after schematic autolayout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} routingDisabled schAutoLayoutEnabled>
      <pinheader
        name="J_STOP"
        manufacturerPartNumber="TSW-102-07-G-S"
        pinCount={2}
        footprint="pinrow2_p2.54mm"
        connections={{ pin1: "net.DRIVE_RESET", pin2: "net.GND" }}
      />
      <resistor
        name="R18"
        resistance="10k"
        footprint="0603"
        schRotation={-90}
        connections={{ pin1: "net.V3V3", pin2: "net.DRIVE_RESET" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
