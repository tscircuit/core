import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a net selector must constrain every terminal independent of trace order", () => {
  const results = []
  for (const tapFirst of [false, true]) {
    const { circuit } = getTestFixture()
    const taps = (
      <>
        <trace from=".U3 > .pin1" to="net.P" />
        <trace from=".U3 > .pin2" to="net.N" />
      </>
    )
    circuit.add(
      <board width={24} height={16} schematicDisabled routingDisabled>
        <chip name="U1" footprint={differentialPairPathPads()} pcbX={-6} />
        <chip name="U2" footprint={differentialPairPathPads()} />
        <chip name="U3" footprint={differentialPairPathPads()} pcbX={6} />
        {tapFirst && taps}
        <trace name="P_TRUNK" path={[".U1 > .pin1", ".U2 > .pin1", "net.P"]} />
        <trace name="N_TRUNK" path={[".U1 > .pin2", ".U2 > .pin2", "net.N"]} />
        {!tapFirst && taps}
        <differentialpair
          name="PAIR"
          positiveConnection="net.P"
          negativeConnection="net.N"
        />
      </board>,
    )
    circuit.render()
    const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: circuit.firstChild!,
    })
    expect(srj.connections).toHaveLength(2)
    expect(srj.differentialPairs).toEqual([
      {
        connectionNames: [
          circuit.db.source_net.getWhere({ name: "P" })!.source_net_id,
          circuit.db.source_net.getWhere({ name: "N" })!.source_net_id,
        ],
        lengthTolerance: 0.1,
      },
    ])
    const pairedPorts = srj.differentialPairs![0].connectionNames.map((name) =>
      srj.connections
        .find((connection) => connection.name === name)!
        .pointsToConnect.map((point) => point.port_selector)
        .sort(),
    )
    expect(pairedPorts).toEqual([
      ["U1.pin1", "U2.pin1", "U3.pin1"],
      ["U1.pin2", "U2.pin2", "U3.pin2"],
    ])
    results.push(pairedPorts)
  }
  expect(results[0]).toEqual(results[1])
})
