import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { AnyCircuitElement, PcbPort } from "circuit-json"
import {
  generateApproximatingRects,
  type RotatedRect,
} from "./generateApproximatingRects"
import { fillPolygonWithRects } from "./fillPolygonWithRects"
import { fillCircleWithRects } from "./fillCircleWithRects"
import type { Obstacle } from "./types"
import { getObstaclesFromRoute } from "./getObstaclesFromRoute"

const EVERY_LAYER = ["top", "inner1", "inner2", "bottom"]

export const getObstaclesFromCircuitJson = (
  circuitJson: AnyCircuitElement[],
  connMap?: ConnectivityMap,
) => {
  const withNetId = (idList: string[]) =>
    connMap
      ? idList.concat(
          idList.map((id) => connMap?.getNetConnectedToId(id)!).filter(Boolean),
        )
      : idList
  const obstacles: Obstacle[] = []
  for (const element of circuitJson) {
    if (element.type === "pcb_smtpad") {
      if (element.shape === "circle") {
        obstacles.push({
          type: "oval",
          layers: [element.layer],
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.radius * 2,
          height: element.radius * 2,
          connectedTo: withNetId([element.pcb_smtpad_id]),
          obstacle_type: "pad",
        })
      } else if (element.shape === "rect") {
        obstacles.push({
          type: "rect",
          layers: [element.layer],
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.width,
          height: element.height,
          connectedTo: withNetId([element.pcb_smtpad_id]),
          obstacle_type: "pad",
        })
      } else if (element.shape === "rotated_rect") {
        const rotatedRect: RotatedRect = {
          center: { x: element.x, y: element.y },
          width: element.width,
          height: element.height,
          rotation: element.ccw_rotation,
        }
        const approximatingRects = generateApproximatingRects(rotatedRect)
        for (const rect of approximatingRects) {
          obstacles.push({
            type: "rect",
            layers: [element.layer],
            center: rect.center,
            width: rect.width,
            height: rect.height,
            connectedTo: withNetId([element.pcb_smtpad_id]),
            obstacle_type: "pad",
          })
        }
      }
    } else if (element.type === "pcb_keepout") {
      if (element.shape === "circle") {
        obstacles.push({
          type: "oval",
          layers: element.layers,
          center: {
            x: element.center.x,
            y: element.center.y,
          },
          width: element.radius * 2,
          height: element.radius * 2,
          connectedTo: [],
        })
      } else if (element.shape === "rect") {
        obstacles.push({
          type: "rect",
          layers: element.layers,
          center: {
            x: element.center.x,
            y: element.center.y,
          },
          width: element.width,
          height: element.height,
          connectedTo: [],
        })
      }
    } else if (element.type === "pcb_cutout") {
      if (element.shape === "rect") {
        obstacles.push({
          type: "rect",
          layers: EVERY_LAYER,
          center: {
            x: element.center.x,
            y: element.center.y,
          },
          width: element.width,
          height: element.height,
          connectedTo: [],
        })
      } else if (element.shape === "circle") {
        const approximatingRects = fillCircleWithRects(
          {
            center: element.center,
            radius: element.radius,
          },
          { rectHeight: 0.6 },
        )

        for (const rect of approximatingRects) {
          obstacles.push({
            type: "rect",
            layers: EVERY_LAYER,
            center: rect.center,
            width: rect.width,
            height: rect.height,
            connectedTo: [],
          })
        }
      } else if (element.shape === "polygon") {
        const approximatingRects = fillPolygonWithRects(element.points, {
          rectHeight: 0.6,
        })

        for (const rect of approximatingRects) {
          obstacles.push({
            type: "rect",
            layers: EVERY_LAYER,
            center: rect.center,
            width: rect.width,
            height: rect.height,
            connectedTo: [],
          })
        }
      }
    } else if (element.type === "pcb_hole") {
      if (element.hole_shape === "oval") {
        obstacles.push({
          type: "oval",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.hole_width,
          height: element.hole_height,
          connectedTo: [],
        })
      } else if (element.hole_shape === "square") {
        obstacles.push({
          type: "rect",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.hole_diameter,
          height: element.hole_diameter,
          connectedTo: [],
        })
      } else {
        if ("hole_diameter" in element) {
          obstacles.push({
            type: "rect",
            layers: EVERY_LAYER,
            center: {
              x: element.x,
              y: element.y,
            },
            width: element.hole_diameter,
            height: element.hole_diameter,
            connectedTo: [],
          })
        }
      }
    } else if (element.type === "pcb_plated_hole") {
      if (element.shape === "circle") {
        obstacles.push({
          type: "oval",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_diameter,
          height: element.outer_diameter,
          connectedTo: withNetId([element.pcb_plated_hole_id]),
          obstacle_type: "pad",
        })
      } else if (element.shape === "circular_hole_with_rect_pad") {
        obstacles.push({
          type: "rect",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.rect_pad_width,
          height: element.rect_pad_height,
          connectedTo: withNetId([element.pcb_plated_hole_id]),
          obstacle_type: "pad",
        })
      } else if (element.shape === "oval" || element.shape === "pill") {
        obstacles.push({
          type: "oval",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_width,
          height: element.outer_height,
          connectedTo: withNetId([element.pcb_plated_hole_id]),
          obstacle_type: "pad",
        })
      }
    } else if (element.type === "pcb_trace") {
      if (!element.route) continue

      const pcb_trace = element

      const source_trace = pcb_trace.source_trace_id
        ? circuitJson.find(
            (e) =>
              e.type === "source_trace" &&
              e.source_trace_id === pcb_trace.source_trace_id,
          )
        : null

      const connectedToIds = new Set<string>()
      if (pcb_trace.source_trace_id) {
        connectedToIds.add(pcb_trace.source_trace_id)
      }
      if (source_trace && source_trace.type === "source_trace") {
        for (const id of source_trace.connected_source_net_ids)
          connectedToIds.add(id)
        for (const id of source_trace.connected_source_port_ids)
          connectedToIds.add(id)
      }

      for (const pt of pcb_trace.route) {
        if (pt.route_type === "wire" && pt.start_pcb_port_id) {
          const pcb_port = circuitJson.find(
            (e) =>
              e.type === "pcb_port" && e.pcb_port_id === pt.start_pcb_port_id,
          )
          if (pcb_port?.type === "pcb_port" && pcb_port.source_port_id)
            connectedToIds.add(pcb_port.source_port_id)
        }
        if (pt.route_type === "wire" && pt.end_pcb_port_id) {
          const pcb_port = circuitJson.find(
            (e) =>
              e.type === "pcb_port" && e.pcb_port_id === pt.end_pcb_port_id,
          )
          if (pcb_port?.type === "pcb_port" && pcb_port.source_port_id)
            connectedToIds.add(pcb_port.source_port_id)
        }
      }

      const connectedTo = Array.from(connectedToIds)

      const traceObstacles = getObstaclesFromRoute(element.route, connectedTo)
      obstacles.push(...traceObstacles)
    } else if (element.type === "pcb_via") {
      const netIsAssignable = Boolean((element as any).net_is_assignable)
      obstacles.push({
        type: "rect",
        layers: element.layers,
        center: {
          x: element.x,
          y: element.y,
        },
        connectedTo: [], // TODO we can associate source_ports with this via
        width: element.outer_diameter,
        height: element.outer_diameter,
        netIsAssignable: netIsAssignable || undefined,
        obstacle_type: "pad",
      })
    }
  }
  return obstacles
}
