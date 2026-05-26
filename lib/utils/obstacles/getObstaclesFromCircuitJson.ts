import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { type RotatedRect } from "./generateApproximatingRects"
import { fillPolygonWithRects } from "./fillPolygonWithRects"
import { fillCircleWithRects } from "./fillCircleWithRects"
import type { Obstacle } from "./types"

const EVERY_LAYER = ["top", "inner1", "inner2", "bottom"]
const QUARTER_TURN_TOLERANCE_DEGREES = 0.01

const getPcbTraceConnectedToIds = (
  element: AnyCircuitElement,
  connMap?: ConnectivityMap,
) => {
  if (element.type !== "pcb_trace") return []

  const connectedToIds = new Set<string>([element.pcb_trace_id])
  if (element.source_trace_id) connectedToIds.add(element.source_trace_id)
  for (const id of [element.pcb_trace_id, element.source_trace_id]) {
    if (!id) continue
    for (const sourceTraceId of id.match(/source_trace_\d+/g) ?? []) {
      connectedToIds.add(sourceTraceId)
    }
  }

  for (const point of element.route) {
    if ("start_pcb_port_id" in point && point.start_pcb_port_id) {
      connectedToIds.add(point.start_pcb_port_id)
    }
    if ("end_pcb_port_id" in point && point.end_pcb_port_id) {
      connectedToIds.add(point.end_pcb_port_id)
    }
  }

  if (connMap) {
    for (const id of Array.from(connectedToIds)) {
      const netId = connMap.getNetConnectedToId(id)
      if (netId) connectedToIds.add(netId)
    }
  }

  return Array.from(connectedToIds)
}

const getRoutePointPosition = (
  point: PcbTrace["route"][number] | any,
): { x: number; y: number } | null => {
  if (point.route_type === "wire" || point.route_type === "via") {
    return { x: point.x, y: point.y }
  }
  if (point.route_type === "through_pad") return point.end
  if (point.route_type === "jumper") return point.end
  return null
}

const getRouteSegmentLayer = (
  start: PcbTrace["route"][number] | any,
  end: PcbTrace["route"][number] | any,
): string | null => {
  if (start.route_type === "wire") return start.layer
  if (end.route_type === "wire") return end.layer
  if (start.route_type === "jumper") return start.layer
  if (end.route_type === "jumper") return end.layer
  if (start.route_type === "through_pad") return start.end_layer
  if (end.route_type === "through_pad") return end.start_layer
  if (start.route_type === "via") return start.to_layer
  if (end.route_type === "via") return end.from_layer
  return null
}

const getRoutePointWidth = (point: PcbTrace["route"][number] | any) => {
  if (point.route_type === "wire" || point.route_type === "through_pad") {
    return point.width
  }
  return 0.1
}

const getPcbTraceObstacles = (
  element: PcbTrace,
  connMap?: ConnectivityMap,
): Obstacle[] => {
  const obstacles: Obstacle[] = []
  const connectedTo = getPcbTraceConnectedToIds(element, connMap)

  for (const point of element.route) {
    if (point.route_type !== "via") continue
    const diameter = (point as any).via_diameter ?? 0.5
    obstacles.push({
      obstacleId: `${element.pcb_trace_id}_trace_via_obstacle_${obstacles.length}`,
      obstacleSource: "pcb_trace",
      type: "rect",
      layers: [point.from_layer, point.to_layer],
      center: { x: point.x, y: point.y },
      width: diameter,
      height: diameter,
      connectedTo,
    })
  }

  for (let i = 0; i < element.route.length - 1; i++) {
    const start = element.route[i]
    const end = element.route[i + 1]
    const startPosition = getRoutePointPosition(start)
    const endPosition = getRoutePointPosition(end)
    const layer = getRouteSegmentLayer(start, end)

    if (!startPosition || !endPosition || !layer) continue

    const width = Math.max(getRoutePointWidth(start), getRoutePointWidth(end))
    obstacles.push({
      obstacleId: `${element.pcb_trace_id}_trace_obstacle_${i}`,
      obstacleSource: "pcb_trace",
      type: "rect",
      layers: [layer],
      center: {
        x: (startPosition.x + endPosition.x) / 2,
        y: (startPosition.y + endPosition.y) / 2,
      },
      width: Math.abs(startPosition.x - endPosition.x) + width,
      height: Math.abs(startPosition.y - endPosition.y) + width,
      connectedTo,
    })
  }

  return obstacles
}

const getAxisAlignedRectFromRotatedRect = (
  rotatedRect: RotatedRect,
): {
  center: { x: number; y: number }
  width: number
  height: number
} | null => {
  const normalizedRotation = ((rotatedRect.rotation % 360) + 360) % 360
  const axisAlignedAngles = [0, 90, 180, 270] as const

  for (const angle of axisAlignedAngles) {
    const angularDistance = Math.min(
      Math.abs(normalizedRotation - angle),
      360 - Math.abs(normalizedRotation - angle),
    )

    if (angularDistance > QUARTER_TURN_TOLERANCE_DEGREES) continue

    const isVertical = angle === 90 || angle === 270

    return {
      center: rotatedRect.center,
      width: isVertical ? rotatedRect.height : rotatedRect.width,
      height: isVertical ? rotatedRect.width : rotatedRect.height,
    }
  }

  return null
}

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
    // @ts-ignore
    const pcbComponentId = element.pcb_component_id ?? undefined

    if (element.type === "pcb_smtpad") {
      if (element.shape === "circle") {
        obstacles.push({
          componentId: pcbComponentId,
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
          componentId: pcbComponentId,
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
        const axisAlignedRect = getAxisAlignedRectFromRotatedRect(rotatedRect)
        const rect = axisAlignedRect ?? rotatedRect

        obstacles.push({
          componentId: pcbComponentId,
          type: "rect",
          layers: [element.layer],
          center: rect.center,
          width: rect.width,
          height: rect.height,
          ccwRotationDegrees: element.ccw_rotation,
          connectedTo: withNetId([element.pcb_smtpad_id]),
        })
      } else if (element.shape === "pill" || element.shape === "rotated_pill") {
        obstacles.push({
          componentId: pcbComponentId,
          type: "rect",
          layers: [element.layer],
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.width,
          height: element.height,
          ...(element.shape === "rotated_pill"
            ? { ccwRotationDegrees: element.ccw_rotation }
            : {}),
          connectedTo: withNetId([element.pcb_smtpad_id]),
        })
      } else if (element.shape === "polygon") {
        const xs = element.points.map((point) => point.x)
        const ys = element.points.map((point) => point.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)

        obstacles.push({
          componentId: pcbComponentId,
          type: "rect",
          layers: [element.layer],
          center: {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
          },
          width: maxX - minX,
          height: maxY - minY,
          connectedTo: withNetId([element.pcb_smtpad_id]),
        })
      }
    } else if (element.type === "pcb_keepout") {
      if (element.shape === "circle") {
        obstacles.push({
          componentId: pcbComponentId,
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
          componentId: pcbComponentId,
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
          componentId: pcbComponentId,
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
            componentId: pcbComponentId,
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
            componentId: pcbComponentId,
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
          componentId: pcbComponentId,
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
      } else if (
        element.hole_shape === "pill" ||
        element.hole_shape === "rotated_pill"
      ) {
        obstacles.push({
          componentId: pcbComponentId,
          type: "rect",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.hole_width,
          height: element.hole_height,
          ...(element.hole_shape === "rotated_pill"
            ? { ccwRotationDegrees: element.ccw_rotation }
            : {}),
          connectedTo: [],
        })
      } else if (element.hole_shape === "rect") {
        obstacles.push({
          componentId: pcbComponentId,
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
          componentId: pcbComponentId,
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
          componentId: pcbComponentId,
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
          componentId: pcbComponentId,
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
        obstacles.push({
          componentId: pcbComponentId,
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
      } else if (element.shape === "oval") {
        obstacles.push({
          componentId: pcbComponentId,
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
      } else if (element.shape === "pill") {
        obstacles.push({
          componentId: pcbComponentId,
          type: "rect",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_width,
          height: element.outer_height,
          ccwRotationDegrees: element.ccw_rotation,
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
            componentId: pcbComponentId,
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
      obstacles.push(
        ...getPcbTraceObstacles(element, connMap).map((obstacle) => ({
          ...obstacle,
          componentId: pcbComponentId,
        })),
      )
    } else if (element.type === "pcb_via") {
      const netIsAssignable = Boolean(
        (element as any).net_is_assignable ?? (element as any).netIsAssignable,
      )
      obstacles.push({
        componentId: pcbComponentId,
        type: "rect",
        layers: element.layers,
        center: {
          x: element.x,
          y: element.y,
        },
        connectedTo: withNetId([element.pcb_via_id]),
        width: element.outer_diameter,
        height: element.outer_diameter,
        netIsAssignable: netIsAssignable || undefined,
      })
    }
  }
  return obstacles
}
