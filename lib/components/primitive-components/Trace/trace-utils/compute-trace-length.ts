import type {
  LayerRef,
  PcbStackup,
  PcbStackupLayer,
  PcbTrace,
  PcbTraceRoutePoint,
  Point,
} from "circuit-json"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"

/** Board thickness in mm assumed for a trace that is routed without a board. */
export const STANDARD_BOARD_THICKNESS = 1.6

/** What a layer change travels through: the board's stackup when it has one, else its thickness in mm. */
export type LayerChangeBoard = {
  pcbStackup?: PcbStackup | null
  boardThickness: number
}

/**
 * Copper length of a PCB trace route in mm: the planar length of its wires
 * and through pads plus the Z-distance of every layer change.
 */
export function getTraceLength({
  route,
  pcbStackup,
  boardThickness,
}: { route: PcbTrace["route"] } & LayerChangeBoard): number {
  let traceLength = 0
  let previousPosition: Point | undefined
  for (const routePoint of route) {
    for (const position of getRoutePointPositions(routePoint)) {
      if (previousPosition) {
        traceLength += Math.hypot(
          position.x - previousPosition.x,
          position.y - previousPosition.y,
        )
      }
      previousPosition = position
    }
    traceLength += getRoutePointLayerChangeLength({
      routePoint,
      pcbStackup,
      boardThickness,
    })
  }
  return traceLength
}

/** Z-distance in mm travelled at one route point: a via or a through pad that changes layers, else zero. */
function getRoutePointLayerChangeLength({
  routePoint,
  pcbStackup,
  boardThickness,
}: { routePoint: PcbTraceRoutePoint } & LayerChangeBoard): number {
  if (routePoint.route_type === "wire") return 0
  if (routePoint.route_type === "via") {
    return getLayerChangeLength({
      fromLayer: routePoint.from_layer,
      toLayer: routePoint.to_layer,
      pcbStackup,
      boardThickness,
    })
  }
  return getLayerChangeLength({
    fromLayer: routePoint.start_layer,
    toLayer: routePoint.end_layer,
    pcbStackup,
    boardThickness,
  })
}

/**
 * Z-distance in mm between two copper layers, zero when they are the same.
 *
 * With a stackup this is KiCad's via length: all of an outer copper layer,
 * half of an inner copper layer at either end, and every layer between. A
 * board without a stackup, or whose stackup lacks one of the two layers,
 * counts its whole thickness.
 */
export function getLayerChangeLength({
  fromLayer,
  toLayer,
  pcbStackup,
  boardThickness,
}: { fromLayer: LayerRef; toLayer: LayerRef } & LayerChangeBoard): number {
  if (fromLayer === toLayer) return 0
  if (!pcbStackup) return boardThickness
  const fromIndex = getCopperLayerIndex({ pcbStackup, layer: fromLayer })
  const toIndex = getCopperLayerIndex({ pcbStackup, layer: toLayer })
  if (fromIndex < 0 || toIndex < 0) return boardThickness

  const firstIndex = Math.min(fromIndex, toIndex)
  const lastIndex = Math.max(fromIndex, toIndex)
  let layerChangeLength = 0
  for (let index = firstIndex; index <= lastIndex; index++) {
    const stackupLayer = pcbStackup.layers[index]
    if (stackupLayer.layer_type === "soldermask") continue
    const isEndLayer = index === firstIndex || index === lastIndex
    if (isEndLayer && !isOuterCopperLayer(stackupLayer)) {
      layerChangeLength += stackupLayer.thickness / 2
      continue
    }
    layerChangeLength += stackupLayer.thickness
  }
  return layerChangeLength
}

/** Position of a copper layer in the stackup's top-to-bottom layer list, or -1 when the stackup lacks it. */
function getCopperLayerIndex({
  pcbStackup,
  layer,
}: {
  pcbStackup: PcbStackup
  layer: LayerRef
}): number {
  return pcbStackup.layers.findIndex(
    (stackupLayer) =>
      stackupLayer.layer_type === "copper" && stackupLayer.layer === layer,
  )
}

/** True for top or bottom copper, which a layer change passes through completely. */
function isOuterCopperLayer(stackupLayer: PcbStackupLayer): boolean {
  if (stackupLayer.layer_type !== "copper") return false
  return stackupLayer.layer === "top" || stackupLayer.layer === "bottom"
}
