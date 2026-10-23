import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getCopperPourTerminalsFixture } from "./fixtures/copper-pour-terminals.fixture"

test("a same-net pad inside a pour void is not physically connected", async () => {
  const circuit = await getCopperPourTerminalsFixture()
  const circuitJson: AnyCircuitElement[] = circuit
    .getCircuitJson()
    .map((element) => {
      if (element.type !== "pcb_copper_pour" || element.shape !== "brep")
        return element
      return {
        ...element,
        brep_shape: {
          ...element.brep_shape,
          inner_rings: [
            ...element.brep_shape.inner_rings,
            {
              vertices: [
                { x: -0.75, y: -0.75 },
                { x: 0.75, y: -0.75 },
                { x: 0.75, y: 0.75 },
                { x: -0.75, y: 0.75 },
              ],
            },
          ],
        },
      }
    })
  const pour = circuitJson.find(
    (element) => element.type === "pcb_copper_pour",
  )!
  expect(pour.shape).toBe("brep")
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  expect(simpleRouteJson.connections[0]!.pointsToConnect).toHaveLength(3)
  expect(
    simpleRouteJson.connections[0]!.externallyConnectedPointIds,
  ).toBeUndefined()
})
