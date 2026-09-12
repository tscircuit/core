import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const traceNames = (circuit: any) =>
  circuit.db.source_trace
    .list()
    .map((sourceTrace: any) => sourceTrace.display_name)
    .sort()

test("capacitor bypassFor and bypassTo create the same traces as decouplingFor and decouplingTo", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
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

  expect(traceNames(circuit)).toEqual([
    "capacitor.C1 > port.1 to net.VCC",
    "capacitor.C1 > port.2 to net.GND",
  ])

  const netNames = circuit.db.source_net
    .list()
    .map((sourceNet: any) => sourceNet.name)
    .sort()
  expect(netNames).toContain("VCC")
  expect(netNames).toContain("GND")
})

test("capacitor decouplingFor and decouplingTo still win when both pairs are given", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        decouplingFor="net.VCC"
        decouplingTo="net.GND"
        bypassFor="net.OTHER_POWER"
        bypassTo="net.OTHER_GROUND"
      />
    </board>,
  )

  circuit.render()

  expect(traceNames(circuit)).toEqual([
    "capacitor.C1 > port.1 to net.VCC",
    "capacitor.C1 > port.2 to net.GND",
  ])
})

test("capacitor with neither pair creates no traces", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
    </board>,
  )

  circuit.render()

  expect(traceNames(circuit)).toEqual([])
})
