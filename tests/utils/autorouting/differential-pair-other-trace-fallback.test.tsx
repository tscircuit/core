import { expect, test } from "bun:test"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import { getDifferentialPairsForSimpleRouteJson } from "lib/utils/autorouting/getDifferentialPairsForSimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("does not substitute a different named path even when the net has only two terminals", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={18} routingDisabled schematicDisabled>
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <trace name="CK_P_TRUNK" from=".U1 > .pin8" to=".U2 > .pin1" />
      <trace name="CK_P_ALTERNATE" from=".U1 > .pin8" to=".U2 > .pin1" />
      <trace name="CK_N_TRUNK" from=".U1 > .pin7" to=".U2 > .pin2" />
      <differentialpair
        name="CK_PAIR"
        positiveConnection="CK_P_TRUNK"
        negativeConnection="CK_N_TRUNK"
      />
    </board>,
  )
  circuit.render()
  const board = circuit.firstChild!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: board,
  })
  const trunk = circuit.db.source_trace.getWhere({ name: "CK_P_TRUNK" })!
  const alternate = circuit.db.source_trace.getWhere({
    name: "CK_P_ALTERNATE",
  })!
  expect(alternate.subcircuit_connectivity_map_key).toBe(
    trunk.subcircuit_connectivity_map_key,
  )
  const connectionsWithoutTrunk = simpleRouteJson.connections.filter(
    (connection) => connection.source_trace_id !== trunk.source_trace_id,
  )
  expect(
    connectionsWithoutTrunk.some(
      (connection) => connection.source_trace_id === alternate.source_trace_id,
    ),
  ).toBe(true)
  expect(() =>
    getDifferentialPairsForSimpleRouteJson({
      srjConnections: connectionsWithoutTrunk,
      differentialPairs: board.selectAll<DifferentialPair>("differentialpair"),
      sourceTraces: circuit.db.source_trace.list(),
    }),
  ).toThrow(
    'Could not find an SRJ connection for trace name or port selector "CK_P_TRUNK"',
  )
})
