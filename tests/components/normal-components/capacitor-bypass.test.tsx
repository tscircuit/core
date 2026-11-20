import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor bypassFor and bypassTo create nets and source traces", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        bypassFor="net.VCC"
        bypassTo="net.GND"
      />
    </board>,
  )

  circuit.render()

  const netNames = circuit.db.source_net
    .list()
    .map((net) => net.name)
    .sort()
  expect(netNames).toEqual(["GND", "VCC"])

  const traceDisplayNames = circuit.db.source_trace
    .list()
    .map((trace) => trace.display_name)
    .sort()
  expect(traceDisplayNames).toEqual([
    "capacitor.C1 > port.1 to net.VCC",
    "capacitor.C1 > port.2 to net.GND",
  ])
})
