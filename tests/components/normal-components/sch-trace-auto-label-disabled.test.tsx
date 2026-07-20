import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schTraceAutoLabelEnabled={false} suppresses automatic schematic_net_label elements", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" schTraceAutoLabelEnabled={false}>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        connections={{ VCC: "net.V3_3", GND: "net.GND" }}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        connections={{ pin1: "net.V3_3", pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // With auto-labels disabled no schematic_net_label should be emitted
  expect(circuit.db.schematic_net_label.list()).toHaveLength(0)
})

test("schTraceAutoLabelEnabled unset (default) does emit schematic_net_label elements", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        connections={{ VCC: "net.V3_3", GND: "net.GND" }}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        connections={{ pin1: "net.V3_3", pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Without explicitly disabling auto-labels, they should appear
  expect(circuit.db.schematic_net_label.list().length).toBeGreaterThan(0)
})
