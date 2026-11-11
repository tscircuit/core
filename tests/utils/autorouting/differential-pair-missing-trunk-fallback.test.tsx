import { validateDifferentialPairSourceBuses } from "lib/utils/autorouting/validateDifferentialPairSourceBuses"
import { expect, test } from "bun:test"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import { getDifferentialPairsForSimpleRouteJson } from "lib/utils/autorouting/getDifferentialPairsForSimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { OrangeCrabDdrClockBoard } from "tests/fixtures/orangecrab-ddr-clock/board"

test("does not substitute an OrangeCrab termination tap for a missing clock trunk", () => {
  const { circuit } = getTestFixture({ platform: { routingDisabled: true } })
  circuit.add(
    <board width={20} height={14} schematicDisabled routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <resistor name="RT" resistance={100} footprint="0402" pcbY={4} />
      <trace name="CK_P_TRUNK" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="CK_N_TRUNK" from=".U1 > .pin2" to=".U2 > .pin2" />
      <trace name="CK_P_TAP" from=".U2 > .pin1" to=".RT > .pin1" />
      <trace name="CK_N_TAP" from=".U2 > .pin2" to=".RT > .pin2" />
      <differentialpair
        name="CK_PAIR"
        positiveConnection="CK_P_TRUNK"
        negativeConnection="CK_N_TRUNK"
        maxLengthSkew={0.1}
      />
    </board>,
  )
  circuit.render()
  const board = circuit.firstChild!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: board,
  })
  const differentialPairs =
    board.selectAll<DifferentialPair>("differentialpair")
  for (const polarity of ["P", "N"]) {
    const trunkName = `CK_${polarity}_TRUNK`
    const trunk = circuit.db.source_trace.getWhere({ name: trunkName })!
    const tap = circuit.db.source_trace.getWhere({
      name: `CK_${polarity}_TAP`,
    })!
    const connectionsWithoutTrunk = simpleRouteJson.connections.filter(
      (connection) => connection.source_trace_id !== trunk.source_trace_id,
    )
    expect(
      connectionsWithoutTrunk.some(
        (connection) => connection.source_trace_id === tap.source_trace_id,
      ),
    ).toBe(true)
    expect(() =>
      getDifferentialPairsForSimpleRouteJson({
        srjConnections: connectionsWithoutTrunk,
        sourcePairs: validateDifferentialPairSourceBuses(circuit.db),
      }),
    ).toThrow("each hop needs exactly two routable terminals")
  }
})
