import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("rejects a net-selected pair with an unmatched termination tap", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={16} schematicDisabled routingDisabled>
      <chip
        name="A"
        footprint={differentialPairPathPads()}
        pcbX={-6}
        connections={{ pin1: "net.P", pin2: "net.N" }}
      />
      <chip
        name="B"
        footprint={differentialPairPathPads()}
        pcbX={6}
        connections={{ pin1: "net.P", pin2: "net.N" }}
      />
      <resistor
        name="RT"
        resistance={100}
        footprint="0402"
        pcbY={4}
        connections={{ pin1: "net.P" }}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="net.P"
        negativeConnection="net.N"
      />
    </board>,
  )
  circuit.render()
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: circuit.firstChild!,
    }),
  ).toThrow(
    /net selections must connect to matching terminal components .*RT.pin1/,
  )
})
