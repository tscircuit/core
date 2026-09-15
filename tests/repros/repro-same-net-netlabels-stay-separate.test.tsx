import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Two netlabel-terminated branches on the same net plus a local branch trace
// must not be physically joined by an extra wire (issue #3436).
test("same-net netlabel branches with a local trace stay separate", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      routingDisabled
      schMaxTraceDistance="10mm"
      schTraceAutoLabelEnabled={false}
    >
      <net name="GND" isGroundNet />
      <capacitor
        name="C1"
        capacitance="100nF"
        schX={-2}
        schY={1}
        schOrientation="vertical"
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        schX={-1}
        schY={1}
        schOrientation="vertical"
      />
      <capacitor
        name="C3"
        capacitance="100nF"
        schX={2}
        schY={-1}
        schOrientation="vertical"
      />
      <trace from="C1.pin2" to="C2.pin2" />
      <netlabel
        net="GND"
        connectsTo="C1.pin2"
        schX={-2}
        schY={0.2}
        anchorSide="top"
      />
      <netlabel
        net="GND"
        connectsTo="C3.pin2"
        schX={2}
        schY={-1.8}
        anchorSide="top"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Three traces only: the two short netlabel stubs and the C1-C2 branch.
  // A fourth long wire between the branches would mean the bug regressed.
  expect(circuit.db.schematic_trace.list()).toHaveLength(3)
  expect(
    circuit.db.schematic_net_label.list().filter((l) => l.text === "GND"),
  ).toHaveLength(2)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
