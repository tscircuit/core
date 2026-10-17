import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("separate same-net netlabel branches are not physically joined after a local branch trace (#3436)", async () => {
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

  const traces = circuit.db.schematic_trace.list()
  const netLabels = circuit.db.schematic_net_label.list()

  expect(netLabels).toHaveLength(2)
  expect(netLabels.map((l) => l.text)).toEqual(["GND", "GND"])

  // Only the two short netlabel stubs and the local C1-C2 branch trace should exist;
  // no trace should span across from the C1/C2 branch (x <= -1) to the C3 branch (x >= 2).
  expect(traces).toHaveLength(3)
  for (const trace of traces) {
    const xs = trace.edges.flatMap((e) => [e.from.x, e.to.x])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    expect(minX <= -1 && maxX >= 2).toBe(false)
  }
})
