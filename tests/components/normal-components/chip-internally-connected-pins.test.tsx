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

test("push buttons with internally connected pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="10mm">
      <pushbutton
        name="SW1"
        pcbX={10}
        schX={-3}
        internallyConnectedPins={[["pin1", "pin4"]]}
      />
      <pushbutton
        name="SW2"
        pcbX={-10}
        schX={3}
        internallyConnectedPins={[["pin2", "pin3"]]}
      />
      <trace from=".SW1 .pin1" to=".SW2 .pin2" />
    </board>,
  )

  await circuit.render()

  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "pushbutton-internal-pins",
  )
})
