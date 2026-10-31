import { expect, test } from "bun:test"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import { getDifferentialPairsForSimpleRouteJson } from "lib/utils/autorouting/getDifferentialPairsForSimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { OrangeCrabDdrClockBoard } from "tests/fixtures/orangecrab-ddr-clock/board"

test("does not substitute an OrangeCrab termination tap for a missing clock trunk", () => {
  const { circuit } = getTestFixture({ platform: { routingDisabled: true } })
  circuit.add(<OrangeCrabDdrClockBoard />)
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
        differentialPairs,
        sourceTraces: circuit.db.source_trace.list(),
      }),
    ).toThrow(
      `Could not find an SRJ connection for trace name or port selector "${trunkName}"`,
    )
  }
})
