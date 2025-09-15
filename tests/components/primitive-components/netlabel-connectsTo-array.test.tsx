import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verify netlabel connectsTo accepts an array of selectors

test("netlabel connectsTo array", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="I2C_SENSOR"
        footprint="soic4"
        pinLabels={{
          pin1: "SCL",
          pin2: "SDA",
          pin3: "VCC",
          pin4: "GND",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["SCL", "SDA", "VCC", "GND"],
          },
        }}
      />
      <netlabel
        schX={-2}
        schY={0}
        net="SCL"
        connectsTo={["U1.SCL", "U1.SDA"]}
        anchorSide="right"
      />
    </board>,
  )

  circuit.render()

  const traces = circuit.db.source_trace
    .list()
    .map((t) => t.display_name)
    .sort()
  expect(traces).toMatchInlineSnapshot(`
    [
      "U1.SCL to net.SCL",
      "U1.SDA to net.SCL",
    ]
  `)
})
