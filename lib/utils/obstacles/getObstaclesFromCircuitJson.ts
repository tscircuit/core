import { getObstaclesFromRoute } from "./getObstaclesFromRoute"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { AnyCircuitElement } from "circuit-json"
import {
  generateApproximatingRects,
  type RotatedRect,
} from "./generateApproximatingRects"
import { fillPolygonWithRects } from "./fillPolygonWithRects"
import { fillCircleWithRects } from "./fillCircleWithRects"
import type { Obstacle } from "./types"

const EVERY_LAYER = ["top", "inner1", "inner2", "bottom"]

export const getObstaclesFromCircuitJson = (
  soup: AnyCircuitElement[],
  connMap?: ConnectivityMap,
) => {
  const withNetId = (idList: string[]) =>
    connMap
      ? idList.concat(
          idList.map((id) => connMap?.getNetConnectedToId(id)!).filter(Boolean),
        )
      : idList
  const obstacles: Obstacle[] = []
  for (const element of soup) {
    if (element.type === "pcb_smtpad") {
      if (element.shape === "circle") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          layers: [element.layer],
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.radius * 2,
          height: element.radius * 2,
          connectedTo: withNetId([element.pcb_smtpad_id]),
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
          })
        }
      }
    } else if (element.type === "pcb_keepout") {
      if (element.shape === "circle") {
        obstacles.push({
          // @ts-ignore
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
          // @ts-ignore
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.hole_width,
          height: element.hole_height,
          connectedTo: [],
        })
      } else if (element.hole_shape === "rect") {
        obstacles.push({
          type: "rect",
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
      } else if (
        // @ts-ignore
        element.hole_shape === "round" ||
        element.hole_shape === "circle"
      ) {
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
    } else if (element.type === "pcb_plated_hole") {
      if (element.shape === "circle") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_diameter,
          height: element.outer_diameter,
          connectedTo: withNetId([element.pcb_plated_hole_id]),
        })
      } else if (element.shape === "circular_hole_with_rect_pad") {
        if (element.rect_ccw_rotation) {
          const approximatingRects = generateApproximatingRects({
            center: { x: element.x, y: element.y },
            width: element.rect_pad_width,
            height: element.rect_pad_height,
            rotation: element.rect_ccw_rotation,
          })
          for (const rect of approximatingRects) {
            obstacles.push({
              type: "rect",
              layers: EVERY_LAYER,
              center: rect.center,
              width: rect.width,
              height: rect.height,
              connectedTo: withNetId([element.pcb_plated_hole_id]),
            })
          }
        } else {
          obstacles.push({
            // @ts-ignore
            type: "rect",
            layers: EVERY_LAYER,
            center: {
              x: element.x,
              y: element.y,
            },
            width: element.rect_pad_width,
            height: element.rect_pad_height,
            connectedTo: withNetId([element.pcb_plated_hole_id]),
          })
        }
      } else if (element.shape === "oval" || element.shape === "pill") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_width,
          height: element.outer_height,
          connectedTo: withNetId([element.pcb_plated_hole_id]),
        })
      } else if (element.shape === "hole_with_polygon_pad") {
        // Calculate bounding box from pad outline
        if (
          "pad_outline" in element &&
          element.pad_outline &&
          element.pad_outline.length > 0
        ) {
          const xs = element.pad_outline.map((p) => element.x + p.x)
          const ys = element.pad_outline.map((p) => element.y + p.y)
          const minX = Math.min(...xs)
          const maxX = Math.max(...xs)
          const minY = Math.min(...ys)
          const maxY = Math.max(...ys)
          const centerX = (minX + maxX) / 2
          const centerY = (minY + maxY) / 2
          obstacles.push({
            // @ts-ignore
            type: "rect",
            layers: EVERY_LAYER,
            center: {
              x: centerX,
              y: centerY,
            },
            width: maxX - minX,
            height: maxY - minY,
            connectedTo: withNetId([element.pcb_plated_hole_id]),
          })
        }
      }
    } else if (element.type === "pcb_trace") {
      const traceObstacles = getObstaclesFromRoute(
        element.route.map((rp) => ({
          x: rp.x,
          y: rp.y,
          layer: "layer" in rp ? rp.layer : rp.from_layer,
        })),
        element.source_trace_id!,
      )
      obstacles.push(...traceObstacles)
    } else if (element.type === "pcb_via") {
      const netIsAssignable = Boolean(
        (element as any).net_is_assignable ?? (element as any).netIsAssignable,
      )
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
      })
    }
  }
  return obstacles
}
