import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("shorted pair nets cannot be passed as both polarities", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={18} height={10} routingDisabled schematicDisabled>
      <chip
        name="U1"
        footprint={differentialPairPathPads()}
        pcbX={-5}
        connections={{ pin1: "net.P", pin2: "net.N" }}
      />
      <chip
        name="U2"
        footprint={differentialPairPathPads()}
        pcbX={5}
        connections={{ pin1: "net.P", pin2: "net.N" }}
      />
      <trace from="net.P" to="net.N" />
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
  ).toThrow(/must resolve to different electrical nets/)
})
