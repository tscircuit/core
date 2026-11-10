import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("net selector pair membership must not depend on trace declaration order", () => {
  const results = []
  for (const reverse of [false, true]) {
    const { circuit } = getTestFixture()
    const sections = reverse ? ["BC", "AB"] : ["AB", "BC"]
    circuit.add(
      <board width={24} height={16} schematicDisabled routingDisabled>
        <chip name="A" footprint={differentialPairPathPads()} pcbX={-6} />
        <chip name="B" footprint={differentialPairPathPads()} />
        <chip name="C" footprint={differentialPairPathPads()} pcbX={6} />
        {sections.flatMap((section) => [
          <trace
            key={`${section}P`}
            name={`P_${section}`}
            path={[`.${section[0]} > .pin1`, `.${section[1]} > .pin1`, "net.P"]}
          />,
          <trace
            key={`${section}N`}
            name={`N_${section}`}
            path={[`.${section[0]} > .pin2`, `.${section[1]} > .pin2`, "net.N"]}
          />,
        ])}
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
      ["A.pin1", "B.pin1", "C.pin1"],
      ["A.pin2", "B.pin2", "C.pin2"],
    ])
    results.push(pairedPorts)
  }
  expect(results[0]).toEqual(results[1])
})
