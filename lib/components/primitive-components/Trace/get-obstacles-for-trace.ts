import type {
  Obstacle,
  SimpleRouteConnection,
} from "lib/utils/autorouting/SimpleRouteJson"
import { Trace } from "./Trace"
import { getUnitVectorFromDirection } from "@tscircuit/math-utils"

/**
 * Gets the schematic obstacles for a trace.
 *
 * Note: this will probably be optimized to get the schematic obstacles for all
 * traces in the future. It will be done in a separate render step called
 * something like CreateSchematicTraceObstacles and be shared across all
 * traces within a subcircuit
 */
export const getSchematicObstaclesForTrace = (trace: Trace): Obstacle[] => {
  const db = trace.root!.db

  const obstacles: Obstacle[] = []

  // Add obstacles from components and ports
  for (const elm of db.toArray()) {
    if (elm.type === "schematic_component") {
      const pinMargin = 0
      obstacles.push({
        type: "rect",
        layers: ["top"],
        center: elm.center,
        width: elm.size.width + pinMargin,
        height: elm.size.height,
        connectedTo: [],
      })
    }
    if (elm.type === "schematic_port") {
      const dirVec = elm.facing_direction
        ? getUnitVectorFromDirection(elm.facing_direction)
        : {
            x: 0,
            y: 0,
          }
      obstacles.push({
        type: "rect",
        layers: ["top"],
        center: {
          x: elm.center.x - dirVec.x * 0.1,
          y: elm.center.y - dirVec.y * 0.1,
        },
        width: 0.1 + Math.abs(dirVec.x) * 0.3,
        height: 0.1 + Math.abs(dirVec.y) * 0.3,
        connectedTo: [],
      })
    }
    if (elm.type === "schematic_text") {
      obstacles.push({
        type: "rect",
        layers: ["top"],
        center: elm.position,
        width: (elm.text?.length ?? 0) * 0.1,
        height: 0.2,
        connectedTo: [],
      })
    }
    if (elm.type === "schematic_box") {
      obstacles.push({
        type: "rect",
        layers: ["top"],
        center: { x: elm.x, y: elm.y },
        width: elm.width,
        height: elm.height,
        connectedTo: [],
      })
    }
    if (elm.type === "schematic_net_label" && elm.symbol_name) {
      obstacles.push({
        type: "rect",
        layers: ["top"],
        center: elm.center,
        width: 0.25,
        height: 0.6,
        connectedTo: [],
      })
    } else if (elm.type === "schematic_net_label") {
      obstacles.push({
        type: "rect",
        layers: ["top"],
        center: elm.center,
        width: (elm.text?.length ?? 0) * 0.1,
        height: 0.2,
        connectedTo: [],
      })
    }
  }

  return obstacles
}
