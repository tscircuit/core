import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fixed GND label overlaps an automatically routed ground trace", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  // Reduced from SparkFun-Ambient-Light-Sensor-VEML7700-(Qwiic).
  circuit.add(
    <board>
      <chip
        name="U1"
        manufacturerPartNumber="VEML7700_TR"
        schY={1.5}
        pinLabels={{ pin1: "SCL", pin2: "VDD", pin3: "GND", pin4: "SDA" }}
        schPinArrangement={{
          leftSide: { direction: "top-to-bottom", pins: ["VDD", "GND"] },
          rightSide: { direction: "bottom-to-top", pins: ["SCL", "SDA"] },
        }}
      />
      <capacitor
        name="C2"
        capacitance="0.1uF"
        schX={-2.5}
        schY={0.9}
        schRotation={-90}
        connections={{ pin1: ".U1 > .pin2", pin2: "net.GND" }}
      />
      <led
        name="D1"
        color="red"
        schX={-1.8}
        schY={-8.3}
        schRotation={-90}
        connections={{ pin2: "net.GND" }}
      />
      {/* This fixed label is crossed by the automatically routed GND wire. */}
      <netlabel
        net="GND"
        anchorSide="top"
        schX={-1.1}
        schY={1.1}
        connectsTo="U1.pin3"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  // Capture the current bug: the U1-to-D1 ground route crosses the GND text.
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 600,
    height: 1100,
    grid: false,
  })
})
