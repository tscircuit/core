import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression: setting `schTraceAutoLabelEnabled={false}` on a board or
// group must reduce the number of auto-generated `schematic_net_label`
// elements created for ports that are connected to a named net via no
// explicit trace. Previously the prop typechecked but had no observable
// effect when set to false (only the true case was wired up, for
// complex multi-junction trace labelling).

test("schTraceAutoLabelEnabled={false} suppresses auto-net-labels at unconnected named-net ports", async () => {
  const { circuit } = getTestFixture()

  // A chip whose VCC/GND pins are connected to named nets but not to
  // any other component would normally get a net label drawn at each
  // pin (the canonical "label, not wire" rendering). With the prop
  // explicitly disabled, those auto labels should not be created.
  circuit.add(
    <board width="20mm" height="20mm" schTraceAutoLabelEnabled={false}>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        connections={{ VCC: "net.V3_3", GND: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const labels = circuit.db.schematic_net_label.list()
  expect(labels.length).toBe(0)
})

test("schTraceAutoLabelEnabled unset (default) preserves the historical auto-labelling behaviour", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        connections={{ VCC: "net.V3_3", GND: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Without the opt-out, the placer emits auto labels for the named
  // net connections (existing behaviour).
  const labels = circuit.db.schematic_net_label.list()
  expect(labels.length).toBeGreaterThan(0)
})
