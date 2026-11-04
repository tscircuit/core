import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getCopperPourTerminalsFixture } from "./fixtures/copper-pour-terminals.fixture"

test("a retained trace does not yet extend pour terminal connectivity", async () => {
  const circuit = await getCopperPourTerminalsFixture({ bridge: true })
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    ignoreExistingTopLevelPcbRouteState: true,
  })
  expect(simpleRouteJson.traces).toHaveLength(1)
  expect(simpleRouteJson.connections[0]!.pointsToConnect).toHaveLength(3)
  expect(
    simpleRouteJson.connections[0]!.externallyConnectedPointIds,
  ).toBeUndefined()
})
