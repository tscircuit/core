import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getCopperPourTerminalsFixture } from "./fixtures/copper-pour-terminals.fixture"

test("fresh routing must not use a discarded root trace to join copper terminals", async () => {
  const circuit = await getCopperPourTerminalsFixture({ bridge: true })
  // Imported top-level routing has no child-subcircuit ownership.
  const circuitJson = circuit
    .getCircuitJson()
    .map((element) =>
      element.type === "pcb_trace"
        ? { ...element, subcircuit_id: undefined }
        : element,
    )
  const original = structuredClone(circuitJson)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  expect(simpleRouteJson.traces).toBeUndefined()
  expect(
    simpleRouteJson.connections[0]!.externallyConnectedPointIds,
  ).toBeUndefined()
  const netConnection = simpleRouteJson.connections.find(
    (connection) => connection.pointsToConnect.length === 3,
  )!
  expect(netConnection.externallyConnectedPointIds).toEqual([
    netConnection.pointsToConnect
      .filter((point) => point.x <= 0)
      .map((point) => point.pointId!),
  ])
  expect(circuitJson).toEqual(original)
})
