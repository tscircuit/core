import type { SoupUtilObjects } from "@tscircuit/soup-util"
import type { Trace } from "lib/components"
import type { SimpleRouteConnection } from "./SimpleRouteJson"
import type { SimpleRouteJson } from "./SimpleRouteJson"
import { getObstaclesFromSoup } from "@tscircuit/infgrid-ijump-astar"

/**
 * This function can only be called in the PcbTraceRender phase or later
 */
export const getSimpleRouteJsonFromTracesAndDb = ({
  db,
  traces,
  minTraceWidth = 0.1,
}: {
  db: SoupUtilObjects
  traces: Trace[]
  minTraceWidth?: number
}): SimpleRouteJson => {
  const obstacles = getObstaclesFromSoup([
    ...db.pcb_component.list(),
    ...db.pcb_smtpad.list(),
    ...db.pcb_plated_hole.list(),
  ])

  // Calculate bounds
  const allPoints = obstacles.flatMap((o) => [
    {
      x: o.center.x - o.width / 2,
      y: o.center.y - o.height / 2,
    },
    {
      x: o.center.x + o.width / 2,
      y: o.center.y + o.height / 2,
    },
  ])

  const bounds = {
    minX: Math.min(...allPoints.map((p) => p.x)) - 1,
    maxX: Math.max(...allPoints.map((p) => p.x)) + 1,
    minY: Math.min(...allPoints.map((p) => p.y)) - 1,
    maxY: Math.max(...allPoints.map((p) => p.y)) + 1,
  }

  // Create connections from traces
  const connections: SimpleRouteConnection[] = traces
    .map((trace) => {
      const connectedPorts = trace._findConnectedPorts()
      if (!connectedPorts.allPortsFound || connectedPorts.ports.length < 2)
        return null

      return {
        name: trace.source_trace_id ?? "",
        pointsToConnect: connectedPorts.ports.map((port) => {
          const pos = port._getGlobalPcbPositionBeforeLayout()
          return {
            x: pos.x,
            y: pos.y,
            layer: (port.getAvailablePcbLayers()[0] ?? "top") as any,
          }
        }),
      }
    })
    .filter((c): c is SimpleRouteConnection => c !== null)

  return {
    bounds,
    obstacles: [],
    connections,
    layerCount: 2,
    minTraceWidth,
  }
}
