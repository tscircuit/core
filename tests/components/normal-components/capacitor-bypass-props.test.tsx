import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor bypassFor and bypassTo create nets and source traces like decouplingFor and decouplingTo", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
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

  const sourceNets = circuit.db.source_net
    .list()
    .map((net) => net.name)
    .sort()
  expect(sourceNets).toEqual(["GND", "VCC"])

  const sourceTraces = circuit.db.source_trace
    .list()
    .map((trace) => trace.display_name)
    .sort()
  expect(sourceTraces).toEqual([
    "capacitor.C1 > port.1 to net.VCC",
    "capacitor.C1 > port.2 to net.GND",
  ])
})
