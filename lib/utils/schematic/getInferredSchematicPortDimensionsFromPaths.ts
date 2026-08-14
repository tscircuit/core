import {
  type Bounds,
  type Point,
  distance,
  getBoundsCenter,
  getBoundsFromPoints,
  getUnitVectorFromDirection,
} from "@tscircuit/math-utils"
import { applyToPoint, compose, scale, translate } from "transformation-matrix"
import {
  DEFAULT_SCHEMATIC_PORT_DISTANCE_FROM_EDGE,
  type SchematicBoxDimensions,
  type SchematicBoxPortPositionWithMetadata,
} from "./getAllDimensionsForSchematicBox"

type SymbolEdge = "left" | "right" | "top" | "bottom"

type SymbolEdgePoint = Point & {
  side: SymbolEdge
}

const SIDE_TO_FACING_DIRECTION = {
  left: "left",
  right: "right",
  top: "up",
  bottom: "down",
} as const

const getBoundarySide = (
  point: Point,
  bounds: Bounds,
  tolerance: number,
): SymbolEdge | null => {
  if (Math.abs(point.x - bounds.minX) <= tolerance) return "left"
  if (Math.abs(point.x - bounds.maxX) <= tolerance) return "right"
  if (Math.abs(point.y - bounds.minY) <= tolerance) return "bottom"
  if (Math.abs(point.y - bounds.maxY) <= tolerance) return "top"
  return null
}

const orderEndpointsCcw = (endpoints: SymbolEdgePoint[]) => [
  ...endpoints
    .filter((point) => point.side === "left")
    .sort((a, b) => b.y - a.y),
  ...endpoints
    .filter((point) => point.side === "bottom")
    .sort((a, b) => a.x - b.x),
  ...endpoints
    .filter((point) => point.side === "right")
    .sort((a, b) => a.y - b.y),
  ...endpoints
    .filter((point) => point.side === "top")
    .sort((a, b) => b.x - a.x),
]

export const getInferredSchematicPortDimensionsFromPaths = ({
  subpaths,
  pinCount,
  targetWidth,
  targetHeight,
}: {
  subpaths: Point[][]
  pinCount: number
  targetWidth?: number
  targetHeight?: number
}): SchematicBoxDimensions | null => {
  if (pinCount === 0) return null

  const bounds = getBoundsFromPoints(subpaths.flat())
  if (!bounds) return null

  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const tolerance = Math.max(width, height, 1) * 1e-6
  const pointsAreEqual = (a: Point, b: Point) => distance(a, b) <= tolerance

  const boundaryEndpoints: SymbolEdgePoint[] = []
  for (const path of subpaths) {
    if (path.length < 2) continue
    const first = path[0]!
    const last = path[path.length - 1]!
    if (pointsAreEqual(first, last)) continue

    for (const endpoint of [first, last]) {
      const side = getBoundarySide(endpoint, bounds, tolerance)
      if (!side) continue
      if (
        boundaryEndpoints.some(
          (candidate) =>
            candidate.side === side && pointsAreEqual(candidate, endpoint),
        )
      ) {
        continue
      }
      boundaryEndpoints.push({ ...endpoint, side })
    }
  }

  // Only infer when the geometry gives an unambiguous one-to-one mapping.
  if (boundaryEndpoints.length !== pinCount) return null

  const scaleX =
    targetWidth !== undefined && width > 0 ? targetWidth / width : 1
  const scaleY =
    targetHeight !== undefined && height > 0 ? targetHeight / height : 1
  const shouldResize = targetWidth !== undefined || targetHeight !== undefined
  const center = getBoundsCenter(bounds)
  const resizeTransform = shouldResize
    ? compose(scale(scaleX, scaleY), translate(-center.x, -center.y))
    : null

  const ports = orderEndpointsCcw(boundaryEndpoints).map((endpoint, index) => {
    const bodyConnectionPoint = resizeTransform
      ? applyToPoint(resizeTransform, endpoint)
      : endpoint
    const outwardDirection = getUnitVectorFromDirection(
      SIDE_TO_FACING_DIRECTION[endpoint.side],
    )

    return {
      x:
        bodyConnectionPoint.x +
        outwardDirection.x * DEFAULT_SCHEMATIC_PORT_DISTANCE_FROM_EDGE,
      y:
        bodyConnectionPoint.y +
        outwardDirection.y * DEFAULT_SCHEMATIC_PORT_DISTANCE_FROM_EDGE,
      side: endpoint.side,
      pinNumber: index + 1,
      trueIndex: index,
      distanceFromOrthogonalEdge: 0,
      stemLength: DEFAULT_SCHEMATIC_PORT_DISTANCE_FROM_EDGE,
    } satisfies SchematicBoxPortPositionWithMetadata
  })
  const size = {
    width: targetWidth ?? width,
    height: targetHeight ?? height,
  }

  return {
    pinCount,
    getPortPositionByPinNumber(pinNumber) {
      return ports.find((port) => port.pinNumber === pinNumber) ?? null
    },
    getSize() {
      return size
    },
    getSizeIncludingPins() {
      return size
    },
  }
}
