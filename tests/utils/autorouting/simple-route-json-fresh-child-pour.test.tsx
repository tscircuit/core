import { expect, test } from "bun:test"
import { checkCopperPourShorts } from "@tscircuit/checks"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getFreshChildPourFixture } from "tests/repros/fixtures/retained-pour.fixture"
import {
  getRetainedPourWireOverlapArea,
  routeRetainedPourConnections,
} from "tests/repros/fixtures/retained-pour-routing"

test("fresh parent routing preserves child pours and discards root pours", async () => {
  const { circuit, circuitJson } = await getFreshChildPourFixture()
  const original = structuredClone(circuitJson)
  expect(
    circuitJson.filter((element) => element.type.endsWith("error")),
  ).toEqual([])
  const pours = circuit.db.pcb_copper_pour.list()
  expect(pours).toHaveLength(2)
  const childPour = pours.find((pour) => pour.layer === "top")!
  const rootPour = pours.find((pour) => pour.layer === "bottom")!
  const childGroup = circuit.db.source_group.getWhere({
    subcircuit_id: childPour.subcircuit_id,
  })!
  expect(childGroup.parent_subcircuit_id).toBe(rootPour.subcircuit_id)
  if (childPour.shape !== "brep") throw new Error("Expected child BREP copper")
  expect(childPour.brep_shape.inner_rings).toHaveLength(1)

  const routingInput = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
    minTraceToPadEdgeClearance: 0.2,
  }).simpleRouteJson
  const pourObstacles = routingInput.obstacles.filter((obstacle) =>
    pours.some((pour) =>
      obstacle.connectedTo.includes(pour.pcb_copper_pour_id),
    ),
  )
  expect(pourObstacles).toHaveLength(4)
  expect(
    pourObstacles.every(
      (obstacle) =>
        obstacle.layers.length === 1 && obstacle.layers[0] === "top",
    ),
  ).toBe(true)
  expect(
    pourObstacles.every((obstacle) =>
      obstacle.connectedTo.includes(childPour.source_net_id!),
    ),
  ).toBe(true)
  expect(
    pourObstacles.some((obstacle) =>
      obstacle.connectedTo.includes(rootPour.source_net_id!),
    ),
  ).toBe(false)
  expect(routingInput.connections).toHaveLength(1)
  const { routedTraces, vias } =
    await routeRetainedPourConnections(routingInput)
  expect(routedTraces).toHaveLength(1)
  const signal = routedTraces[0]!
  expect(vias).toHaveLength(2)
  expect(getRetainedPourWireOverlapArea(childPour, signal, 0.2)).toBeLessThan(
    1e-9,
  )
  expect([signal.route[0], signal.route.at(-1)]).toEqual(
    expect.arrayContaining(
      routingInput.connections[0]!.pointsToConnect.map((point) =>
        expect.objectContaining({ x: point.x, y: point.y, layer: point.layer }),
      ),
    ),
  )
  // Fresh routing will regenerate root copper. The physical handoff retains
  // child copper; the converter above still received every original record.
  const retained = circuitJson.filter(
    (element) =>
      element.type !== "pcb_copper_pour" ||
      element.pcb_copper_pour_id !== rootPour.pcb_copper_pour_id,
  )
  const result = [...retained, ...routedTraces, ...vias]
  expect(checkCopperPourShorts(result)).toHaveLength(0)
  expect(circuitJson).toEqual(original)
  await expect(
    result.filter((element) => element.type !== "pcb_silkscreen_text"),
  ).toMatchPcbSnapshot(import.meta.path)
})
