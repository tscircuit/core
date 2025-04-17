import type {
  Obstacle,
  SimpleRouteConnection,
} from "lib/utils/autorouting/SimpleRouteJson"
import { Trace } from "./Trace"
import { getUnitVectorFromDirection } from "@tscircuit/math-utils"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

/**
 * Gets the schematic obstacles for a trace.
 *
 * Note: this will probably be optimized to get the schematic obstacles for all
 * traces in the future. It will be done in a separate render step called
 * something like CreateSchematicTraceObstacles and be shared across all
 * traces within a subcircuit
 */
export const getSchematicObstaclesForTrace = ({
  db,
}: { db: CircuitJsonUtilObjects }): Obstacle[] => {
  const obstacles: Obstacle[] = []

  for (const elm of db.schematic_component.list()) {
    // TODO HACK we have to have special handling for components because of
    // a bug in circuit-to-svg where it uses the schematic_component size to
    // draw boxes instead of the schematic_box size, until we have proper
    // schematic_box elements we need to use custom handling because symbols
    // are sized properly but schematic_components are sized incorrectly
    // Use tests/components/primitive-components/trace-schematic-obstacles-1.test.tsx
    // to see the difference and test
    const isSymbol = Boolean(elm.symbol_name)
    const dominateAxis = elm.size.width > elm.size.height ? "horz" : "vert"
    obstacles.push({
      type: "rect",
      layers: ["top"],
      center: elm.center,
      width: elm.size.width + (isSymbol && dominateAxis === "horz" ? -0.5 : 0),
      height:
        elm.size.height + (isSymbol && dominateAxis === "vert" ? -0.5 : 0),
      connectedTo: [],
    })
  }

  for (const elm of db.schematic_text.list()) {
    obstacles.push({
      type: "rect",
      layers: ["top"],
      center: elm.position,
      width: (elm.text?.length ?? 0) * 0.1,
      height: 0.2,
      connectedTo: [],
    })
  }

  // Add obstacles from components and ports
  for (const elm of db.toArray()) {
    // if (elm.type === "schematic_port") {
    //   if (connectedPortIds.has(elm.schematic_port_id)) {
    //     continue
    //   }
    //   const dirVec = elm.facing_direction
    //     ? getUnitVectorFromDirection(elm.facing_direction)
    //     : {
    //         x: 0,
    //         y: 0,
    //       }
    //   obstacles.push({
    //     type: "rect",
    //     layers: ["top"],
    //     center: {
    //       x: elm.center.x - dirVec.x * 0.1,
    //       y: elm.center.y - dirVec.y * 0.1,
    //     },
    //     width: 0.1 + Math.abs(dirVec.x) * 0.3,
    //     height: 0.1 + Math.abs(dirVec.y) * 0.3,
    //     connectedTo: [],
    //   })
    // }
    // if (elm.type === "schematic_text") {
    // }
    // if (elm.type === "schematic_box") {
    //   obstacles.push({
    //     type: "rect",
    //     layers: ["top"],
    //     center: { x: elm.x, y: elm.y },
    //     width: elm.width,
    //     height: elm.height,
    //     connectedTo: [],
    //   })
    // }
    // Schematic symbols don't need obstacles- traces often route through them
    // we might roll this back later...
    // if (elm.type === "schematic_net_label" && elm.symbol_name) {
    //   obstacles.push({
    //     type: "rect",
    //     layers: ["top"],
    //     center: elm.center,
    //     width: 0.25,
    //     height: 0.6,
    //     connectedTo: [],
    //   })
    // } else if (elm.type === "schematic_net_label") {
    //   obstacles.push({
    //     type: "rect",
    //     layers: ["top"],
    //     center: elm.center,
    //     width: (elm.text?.length ?? 0) * 0.1,
    //     height: 0.2,
    //     connectedTo: [],
    //   })
    // }
  }

  return obstacles
}
