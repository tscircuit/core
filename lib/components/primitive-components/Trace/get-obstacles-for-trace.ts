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
  const connectedPorts = trace._findConnectedPorts().ports ?? []
  const connectedPortIds = new Set(
    connectedPorts.map((p) => p.schematic_port_id),
  )

  const obstacles: Obstacle[] = []

  // Add obstacles from components and ports
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const elm of db.toArray()) {
    // Track bounds for border obstacle
    let cx: number | undefined,
      cy: number | undefined,
      w: number | undefined,
      h: number | undefined
    if (elm.type === "schematic_component") {
      cx = elm.center?.x
      cy = elm.center?.y
      w = elm.size?.width
      h = elm.size?.height
    } else if (elm.type === "schematic_box") {
      cx = elm.x
      cy = elm.y
      w = elm.width
      h = elm.height
    } else if (elm.type === "schematic_port") {
      cx = elm.center?.x
      cy = elm.center?.y
      w = 0.2
      h = 0.2
    } else if (elm.type === "schematic_text") {
      cx = elm.position?.x
      cy = elm.position?.y
      w = (elm.text?.length ?? 0) * 0.1
      h = 0.2
    }
    if (
      typeof cx === "number" &&
      typeof cy === "number" &&
      typeof w === "number" &&
      typeof h === "number"
    ) {
      minX = Math.min(minX, cx - w / 2)
      maxX = Math.max(maxX, cx + w / 2)
      minY = Math.min(minY, cy - h / 2)
      maxY = Math.max(maxY, cy + h / 2)
    }

    if (elm.type === "schematic_component") {
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
        width:
          elm.size.width + (isSymbol && dominateAxis === "horz" ? -0.5 : 0),
        height:
          elm.size.height + (isSymbol && dominateAxis === "vert" ? -0.5 : 0),
        connectedTo: [],
      })
    }
    if (elm.type === "schematic_port") {
      if (connectedPortIds.has(elm.schematic_port_id)) {
        continue
      }
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

  // Add schematic border as four thin rect obstacles (with padding)
  if (isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY)) {
    const PADDING = 1
    const left = minX - PADDING
    const right = maxX + PADDING
    const top = maxY + PADDING
    const bottom = minY - PADDING
    const thickness = 0.01
    // Top border (horizontal)
    obstacles.push({
      type: "rect",
      layers: ["top"],
      center: { x: (left + right) / 2, y: top },
      width: right - left,
      height: thickness,
      connectedTo: [],
    })
    // Bottom border (horizontal)
    obstacles.push({
      type: "rect",
      layers: ["top"],
      center: { x: (left + right) / 2, y: bottom },
      width: right - left,
      height: thickness,
      connectedTo: [],
    })
    // Left border (vertical)
    obstacles.push({
      type: "rect",
      layers: ["top"],
      center: { x: left, y: (top + bottom) / 2 },
      width: thickness,
      height: top - bottom,
      connectedTo: [],
    })
    // Right border (vertical)
    obstacles.push({
      type: "rect",
      layers: ["top"],
      center: { x: right, y: (top + bottom) / 2 },
      width: thickness,
      height: top - bottom,
      connectedTo: [],
    })
  }

  return obstacles
}
