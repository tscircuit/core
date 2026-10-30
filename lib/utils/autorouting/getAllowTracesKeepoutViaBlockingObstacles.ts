import type { PCBKeepout, PcbSmtPad } from "circuit-json"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import { getObstaclesFromPcbKeepoutOutline } from "lib/utils/obstacles/getObstaclesFromPcbKeepoutOutline"
import type { Obstacle } from "lib/utils/obstacles/types"
import type { SimpleRouteConnection } from "./SimpleRouteJson"

const isPointInsideKeepout = (
  keepout: PCBKeepout,
  point: { x: number; y: number },
): boolean => {
  if (keepout.shape === "circle") {
    return (
      Math.hypot(point.x - keepout.center.x, point.y - keepout.center.y) <=
      keepout.radius
    )
  }

  if (keepout.shape === "rect") {
    return (
      Math.abs(point.x - keepout.center.x) <= keepout.width / 2 &&
      Math.abs(point.y - keepout.center.y) <= keepout.height / 2
    )
  }

  if (keepout.shape === "outline") {
    if (keepout.outline.length === 0) return false
    const halfStroke = (keepout.stroke_width ?? 0) / 2
    const xs = keepout.outline.map((p) => p.x)
    const ys = keepout.outline.map((p) => p.y)
    const minX = Math.min(...xs) - halfStroke
    const maxX = Math.max(...xs) + halfStroke
    const minY = Math.min(...ys) - halfStroke
    const maxY = Math.max(...ys) + halfStroke
    return (
      point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
    )
  }

  return false
}

const createKeepoutObstaclesForLayers = (
  keepout: PCBKeepout,
  layers: string[],
): Obstacle[] => {
  const componentId =
    "pcb_component_id" in keepout
      ? (keepout.pcb_component_id ?? undefined)
      : undefined

  if (keepout.shape === "circle") {
    return [
      {
        componentId,
        type: "rect",
        layers,
        center: {
          x: keepout.center.x,
          y: keepout.center.y,
        },
        width: keepout.radius * 2,
        height: keepout.radius * 2,
        connectedTo: [],
      },
    ]
  }

  if (keepout.shape === "rect") {
    return [
      {
        componentId,
        type: "rect",
        layers,
        center: {
          x: keepout.center.x,
          y: keepout.center.y,
        },
        width: keepout.width,
        height: keepout.height,
        connectedTo: [],
      },
    ]
  }

  if (keepout.shape === "outline") {
    return getObstaclesFromPcbKeepoutOutline(
      {
        ...keepout,
        layers: layers as PCBKeepout["layers"],
      },
      componentId,
    )
  }

  return []
}

/**
 * A non-advisory keepout with `allow_traces: true` permits trace wires inside
 * its region, but through-hole vias are still forbidden inside the keepout by
 * DRC (`checkPcbCopperOverKeepout`). Blocking the board layer(s) not used by
 * pads/terminals inside the keepout leaves trace routing open on the active
 * layer while preventing multi-layer capacity mesh nodes from placing vias
 * inside the keepout.
 */
export const getAllowTracesKeepoutViaBlockingObstacles = ({
  keepouts,
  smtPads,
  connections,
  layerCount,
  allowBlindAndBuriedVias = false,
}: {
  keepouts: readonly PCBKeepout[]
  smtPads: readonly PcbSmtPad[]
  connections: readonly SimpleRouteConnection[]
  layerCount: number
  allowBlindAndBuriedVias?: boolean
}): Obstacle[] => {
  if (allowBlindAndBuriedVias || layerCount < 2) return []

  const boardLayers = getViaBoardLayers(layerCount)
  if (boardLayers.length < 2) return []
  const boardLayerSet = new Set<string>(boardLayers)

  const allConnectionPoints = connections.flatMap(
    (connection) => connection.pointsToConnect,
  )
  const connectionPointLayers = new Set(
    allConnectionPoints
      .map((point) => point.layer)
      .filter((layer): layer is string => boardLayerSet.has(layer)),
  )

  const obstacles: Obstacle[] = []

  for (const keepout of keepouts) {
    if (keepout.warning_only || !keepout.allow_traces) continue
    if (!keepout.layers.some((layer) => boardLayerSet.has(layer))) continue

    const requiredLayersInsideKeepout = new Set<string>()

    for (const point of allConnectionPoints) {
      if (
        boardLayerSet.has(point.layer) &&
        isPointInsideKeepout(keepout, point)
      ) {
        requiredLayersInsideKeepout.add(point.layer)
      }
    }

    for (const pad of smtPads) {
      if (
        "x" in pad &&
        "y" in pad &&
        typeof pad.x === "number" &&
        typeof pad.y === "number" &&
        boardLayerSet.has(pad.layer) &&
        isPointInsideKeepout(keepout, { x: pad.x, y: pad.y })
      ) {
        requiredLayersInsideKeepout.add(pad.layer)
      }
    }

    let blockedLayers: string[]
    if (requiredLayersInsideKeepout.size > 0) {
      blockedLayers = boardLayers.filter(
        (layer) => !requiredLayersInsideKeepout.has(layer),
      )
    } else if (connectionPointLayers.size === 1) {
      const [singleConnectionLayer] = connectionPointLayers
      blockedLayers = boardLayers.filter(
        (layer) => layer !== singleConnectionLayer,
      )
    } else {
      const preferredOpenLayer = keepout.layers.includes("top")
        ? "top"
        : (keepout.layers.find((layer) => boardLayerSet.has(layer)) ??
          boardLayers[0])
      blockedLayers = boardLayers.filter(
        (layer) => layer !== preferredOpenLayer,
      )
    }

    if (blockedLayers.length === 0) continue

    obstacles.push(...createKeepoutObstaclesForLayers(keepout, blockedLayers))
  }

  return obstacles
}
