import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("buses and differential pairs resolve pins and trace names to the same net connections", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={-7} />
      <chip name="U2" footprint="soic8" pcbX={7} />
      <trace name="P_START" from=".U1 > .pin1" to="net.P" />
      <trace from=".U2 > .pin1" to="net.P" />
      <trace name="N_START" from=".U1 > .pin2" to="net.N" />
      <trace from=".U2 > .pin2" to="net.N" />
      <bus name="DATA" connections={[".U1 > .pin1", "N_START"]} />
      <differentialpair
        name="PAIR"
        positiveConnection="P_START"
        negativeConnection=".U2 > .pin2"
      />
    </board>,
  )
  circuit.render()
  const board = circuit.firstChild
  if (!board) throw new Error("Expected a board")
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: board,
  })
  const connectionNames = ["P", "N"].map(
    (name) => circuit.db.source_net.getWhere({ name })!.source_net_id,
  )
  expect(simpleRouteJson.buses).toEqual([
    { busId: "DATA", name: "DATA", connectionNames },
  ])
  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [connectionNames[0], connectionNames[1]],
      lengthTolerance: 0.1,
    },
  ])
})
