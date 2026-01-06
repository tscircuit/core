import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verify net connectsTo accepts an array of selectors

test("net connectsTo array", () => {
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
      <net name="VCC" connectsTo={["U1.VCC", "U1.SCL"]} />
    </board>,
  )

  circuit.render()

  const traces = circuit.db.source_trace
    .list()
    .map((t) => t.display_name)
    .sort()
  expect(traces).toMatchInlineSnapshot(`
    [
      "U1.SCL to net.VCC",
      "U1.VCC to net.VCC",
    ]
  `)
  // add schematic snapshot
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-schematic-array",
  )
  // add pcb snapshot
})

test("net connectsTo string", () => {
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
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["SCL", "SDA"],
          },
        }}
      />
      <net name="DATA" connectsTo="U1.SDA" />
    </board>,
  )

  circuit.render()

  const traces = circuit.db.source_trace
    .list()
    .map((t) => t.display_name)
    .sort()
  expect(traces).toMatchInlineSnapshot(`
    [
      "U1.SDA to net.DATA",
    ]
  `)
  // add schematic snapshot
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-schematic-string",
  )
  // add pcb snapshot
})
