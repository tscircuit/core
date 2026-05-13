import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schTraceAutoLabelEnabled false suppresses auto labels for named net ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1" subcircuit schTraceAutoLabelEnabled={false}>
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ pin1: "VCC", pin2: "GND" }}
          connections={{ VCC: "net.V3_3", GND: "net.GND" }}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_net_label.list()).toHaveLength(0)
})
