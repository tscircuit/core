import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with internally connected pins and connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <net name="VCC" />
      <net name="GND" />
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "OUT",
          pin3: "INT1",
          pin4: "INT2",
        }}
        internallyConnectedPins={[
          ["INT1", "INT2"], // Specify the internally connected pins
        ]}
        connections={{
          VCC: "net.VCC",
          OUT: "net.GND",
        }}
      />
    </board>,
  )

  await circuit.render()

  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "chip-internal-pins",
  )
})
