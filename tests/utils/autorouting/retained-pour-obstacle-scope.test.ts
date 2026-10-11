import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbCopperPourRect } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

// Board-world points in mm, right-handed (+X right, +Y up, +Z above).
test("retained pours follow routing scope and netless pours remain blockers", () => {
  const pours = ["child", "grandchild", "sibling"].map(
    (scope, index): PcbCopperPourRect => ({
      type: "pcb_copper_pour",
      pcb_copper_pour_id: `pcb_copper_pour_${scope}`,
      subcircuit_id: `subcircuit_${scope}`,
      layer: "top",
      shape: "rect",
      center: { x: index * 2, y: 0 },
      width: 1,
      height: 1,
      covered_with_solder_mask: true,
    }),
  )
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      num_layers: 2,
      thickness: 1.6,
      material: "fr4",
    },
    {
      type: "source_group",
      source_group_id: "source_group_child",
      subcircuit_id: "subcircuit_child",
    },
    {
      type: "source_group",
      source_group_id: "source_group_grandchild",
      subcircuit_id: "subcircuit_grandchild",
      parent_subcircuit_id: "subcircuit_child",
    },
    {
      type: "source_group",
      source_group_id: "source_group_sibling",
      subcircuit_id: "subcircuit_sibling",
    },
    ...pours,
  ]
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    subcircuit_id: "subcircuit_child",
  })
  expect(
    new Set(simpleRouteJson.obstacles.map((obstacle) => obstacle.obstacleId)),
  ).toEqual(new Set(["pcb_copper_pour_child", "pcb_copper_pour_grandchild"]))
  expect(
    simpleRouteJson.obstacles.every(
      (obstacle) =>
        obstacle.connectedTo.length === 1 &&
        obstacle.connectedTo[0] === obstacle.obstacleId &&
        !obstacle.isCopperPour,
    ),
  ).toBe(true)
  const global = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  }).simpleRouteJson
  expect(
    new Set(global.obstacles.map((obstacle) => obstacle.obstacleId)),
  ).toEqual(new Set(pours.map((pour) => pour.pcb_copper_pour_id)))
})
