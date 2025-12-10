import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("interconnect pads have offBoardConnectsTo and netIsAssignable set", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <interconnect name="IC1" standard="0603" pcbX={0} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  // Get the internal connection to find its ID
  const internalConnections =
    circuit.db.source_component_internal_connection.list()
  expect(internalConnections).toHaveLength(1)
  const internalConnectionId =
    internalConnections[0].source_component_internal_connection_id

  // Find obstacles that have offBoardConnectsTo set
  const interconnectObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) =>
      obstacle.offBoardConnectsTo &&
      obstacle.offBoardConnectsTo.includes(internalConnectionId),
  )

  // There should be 2 obstacles (one for each pad of the 0603 interconnect)
  expect(interconnectObstacles).toHaveLength(2)

  // Both obstacles should have netIsAssignable: true
  for (const obstacle of interconnectObstacles) {
    expect(obstacle.netIsAssignable).toBe(true)
    expect(obstacle.offBoardConnectsTo).toContain(internalConnectionId)
  }
})
