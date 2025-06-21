import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib"

test("netlabel connection traces", () => {
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
        connections={{
          SCL: sel.net.SCL,
          SDA: sel.net.SDA,
          VCC: sel.net.V3_3,
          GND: sel.net.GND,
        }}
      />
      <netlabel
        schX={-2}
        schY={-1}
        anchorSide="top"
        net="GND"
        connection="U1.GND"
      />
      <netlabel
        schX={-2}
        schY={0.8}
        net="VCC"
        connection="U1.VCC"
        anchorSide="bottom"
      />
    </board>,
  )

  circuit.render()

  const junctions = circuit.db.schematic_trace
    .list()
    .flatMap((t) => t.junctions || [])

  expect(junctions.length).toBe(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
