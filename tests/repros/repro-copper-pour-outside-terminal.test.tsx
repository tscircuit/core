import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver } from "@tscircuit/capacity-autorouter"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getCopperPourTerminalsFixture } from "./fixtures/copper-pour-terminals.fixture"

test("only the terminal outside the copper pour needs routing", async () => {
  const circuit = await getCopperPourTerminalsFixture()
  const circuitJson = circuit.getCircuitJson()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const gndConnection = simpleRouteJson.connections[0]!
  expect(gndConnection.pointsToConnect).toHaveLength(3)
  expect(gndConnection.externallyConnectedPointIds).toEqual([
    gndConnection.pointsToConnect
      .filter((point) => point.x <= 0)
      .map((point) => point.pointId!),
  ])

  expect(simpleRouteJson.traces ?? []).toHaveLength(0)
  const router = new AutoroutingPipelineSolver({
    ...simpleRouteJson,
    traces: [],
  })
  while (!router.srjWithPointPairs && !router.failed && !router.solved) {
    router.step()
  }
  expect(router.failed).toBe(false)
  expect(router.srjWithPointPairs!.connections).toHaveLength(1)
})
