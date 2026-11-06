import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keeps a residual net connection between disjoint explicit pair paths", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={40} height={16} routingDisabled schematicDisabled>
      <chip name="A" footprint="soic8" pcbX={-15} />
      <chip name="B" footprint="soic8" pcbX={-5} />
      <chip name="C" footprint="soic8" pcbX={5} />
      <chip name="D" footprint="soic8" pcbX={15} />
      <trace name="P_AB" path={[".A > .pin8", ".B > .pin1", "net.P"]} />
      <trace name="N_AB" path={[".A > .pin7", ".B > .pin2", "net.N"]} />
      <trace name="P_CD" path={[".C > .pin8", ".D > .pin1", "net.P"]} />
      <trace name="N_CD" path={[".C > .pin7", ".D > .pin2", "net.N"]} />
      <differentialpair
        name="AB"
        positiveConnection=".A > .pin8"
        negativeConnection="N_AB"
      />
      <differentialpair
        name="CD"
        positiveConnection="P_CD"
        negativeConnection="N_CD"
      />
      <pcbnotetext
        pcbY={-5}
        fontSize={0.65}
        text="A–B and C–D are separate paired path requests"
      />
      <pcbnotetext
        pcbY={-6.5}
        fontSize={0.6}
        text="Each shared net must still join the two paths"
      />
    </board>,
  )
  circuit.render()
  const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild!,
  })
  expect(srj.connections).toHaveLength(6)
  for (const polarity of ["P", "N"]) {
    const net = circuit.db.source_net.getWhere({ name: polarity })!
    const residual = srj.connections.find(
      (connection) => connection.name === net.source_net_id,
    )!
    const endpointSets = ["AB", "CD"].map((suffix) => {
      const trace = circuit.db.source_trace.getWhere({
        name: `${polarity}_${suffix}`,
      })!
      const connection = srj.connections.find(
        (connection) => connection.source_trace_id === trace.source_trace_id,
      )!
      return new Set(connection.pointsToConnect.map((point) => point.pointId))
    })
    expect(residual.pointsToConnect).toHaveLength(2)
    for (const endpoints of endpointSets) {
      expect(
        residual.pointsToConnect.filter((point) =>
          endpoints.has(point.pointId),
        ),
      ).toHaveLength(1)
    }
    expect(residual.externallyConnectedPointIds).toBeUndefined()
  }
  expect(srj.differentialPairs).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
