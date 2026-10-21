import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getCopperPourTerminalsFixture } from "./fixtures/copper-pour-terminals.fixture"

test("overlapping XY coordinates on different copper layers do not join terminals", async () => {
  const circuit = await getCopperPourTerminalsFixture()
  const circuitJson: AnyCircuitElement[] = circuit
    .getCircuitJson()
    .map((element) => {
      if (element.type === "pcb_smtpad" && element.x === 0) {
        return { ...element, layer: "bottom" }
      }
      if (element.type === "pcb_port" && element.x === 0) {
        return { ...element, layers: ["bottom"] }
      }
      return element
    })
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  expect(simpleRouteJson.connections[0]!.pointsToConnect).toHaveLength(3)
  expect(
    simpleRouteJson.connections[0]!.externallyConnectedPointIds,
  ).toBeUndefined()
})
