import type {
  BusFanoutDirection,
  CanonicalBusFanoutDirection,
} from "@tscircuit/props"

interface BoardPoint {
  x: number
  y: number
}

type CardinalEdge = "right" | "top" | "left" | "bottom"

const EDGE_CYCLE: readonly CardinalEdge[] = ["right", "top", "left", "bottom"]

const canonicalDirectionByEdgeAndPosition = {
  right: {
    top: "rightside_top",
    center: "rightside_center",
    bottom: "rightside_bottom",
  },
  top: {
    left: "topside_left",
    center: "topside_center",
    right: "topside_right",
  },
  left: {
    bottom: "leftside_bottom",
    center: "leftside_center",
    top: "leftside_top",
  },
  bottom: {
    right: "bottomside_right",
    center: "bottomside_center",
    left: "bottomside_left",
  },
} as const

const canonicalDirectionGeometry = Object.entries(
  canonicalDirectionByEdgeAndPosition,
).flatMap(([edge, directionByPosition]) =>
  Object.entries(directionByPosition).map(([position, direction]) => ({
    direction,
    edge: edge as CardinalEdge,
    position,
  })),
)

const geometryByCanonicalDirection = new Map(
  canonicalDirectionGeometry.map((geometry) => [geometry.direction, geometry]),
)

const rotatePointQuarterTurnCounterclockwise = ({ x, y }: BoardPoint) => ({
  x: -y,
  y: x,
})

const edgeVectorByEdge: Readonly<Record<CardinalEdge, BoardPoint>> = {
  right: { x: 1, y: 0 },
  top: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  bottom: { x: 0, y: -1 },
}

const positionVectorByEdgeAndPosition = new Map(
  canonicalDirectionGeometry.map(({ edge, position, direction }) => {
    const positionVector =
      position === "center"
        ? { x: 0, y: 0 }
        : edgeVectorByEdge[position as CardinalEdge]
    return [direction, positionVector] as const
  }),
)

const getDirectionLiteral = (direction: BusFanoutDirection) =>
  typeof direction === "string" ? direction : direction.direction

const getTargetEdge = (
  source: BoardPoint,
  target: BoardPoint,
): CardinalEdge => {
  const deltaX = target.x - source.x
  const deltaY = target.y - source.y
  if (![source.x, source.y, target.x, target.y].every(Number.isFinite)) {
    throw new Error("Orbit fanout component centers must be finite")
  }
  if (Math.hypot(deltaX, deltaY) <= 1e-6) {
    throw new Error("Orbit fanout source and target centers must differ")
  }
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? "right" : "left"
  }
  return deltaY >= 0 ? "top" : "bottom"
}

const rotateCanonicalDirection = (
  direction: CanonicalBusFanoutDirection,
  quarterTurnsCounterclockwise: number,
): CanonicalBusFanoutDirection => {
  if (direction === "center") return direction
  const geometry = geometryByCanonicalDirection.get(direction)
  const positionVector = positionVectorByEdgeAndPosition.get(direction)
  if (!geometry || !positionVector) {
    throw new Error(`Unsupported canonical fanout direction "${direction}"`)
  }
  let edgeVector = edgeVectorByEdge[geometry.edge]
  let rotatedPositionVector = positionVector
  for (let turn = 0; turn < quarterTurnsCounterclockwise; turn += 1) {
    edgeVector = rotatePointQuarterTurnCounterclockwise(edgeVector)
    rotatedPositionVector = rotatePointQuarterTurnCounterclockwise(
      rotatedPositionVector,
    )
  }
  const rotatedEdge = EDGE_CYCLE.find(
    (edge) =>
      edgeVectorByEdge[edge].x === edgeVector.x &&
      edgeVectorByEdge[edge].y === edgeVector.y,
  )!
  const rotatedPosition =
    rotatedPositionVector.x === 0 && rotatedPositionVector.y === 0
      ? "center"
      : EDGE_CYCLE.find(
          (edge) =>
            edgeVectorByEdge[edge].x === rotatedPositionVector.x &&
            edgeVectorByEdge[edge].y === rotatedPositionVector.y,
        )!
  const rotatedDirection = (
    canonicalDirectionByEdgeAndPosition[rotatedEdge] as Record<string, string>
  )[rotatedPosition]
  if (!rotatedDirection) {
    throw new Error(
      `Could not rotate canonical fanout direction "${direction}"`,
    )
  }
  return rotatedDirection as CanonicalBusFanoutDirection
}

/**
 * Rotates a same-edge canonical bus fanout map toward another component.
 * Component centers are board/circuit world-space points in millimeters in a
 * right-handed XY frame (+X right, +Y top). The returned values are board-space
 * directions, so they rotate but never pick up either point's translation.
 * The bus ordering along the edge rotates with the map, so a bundle remains
 * together as its target moves through the four orbit quadrants.
 */
export const getOrbitAwareBusFanoutDirections = <BusId extends string>({
  baseDirections,
  sourceComponentCenter,
  targetComponentCenter,
}: {
  baseDirections: Readonly<Record<BusId, BusFanoutDirection>>
  sourceComponentCenter: BoardPoint
  targetComponentCenter: BoardPoint
}): Record<BusId, BusFanoutDirection> => {
  const canonicalEntries = Object.entries(baseDirections).flatMap(
    ([busId, direction]) => {
      const literal = getDirectionLiteral(direction as BusFanoutDirection)
      if (literal === "center") return []
      const geometry = geometryByCanonicalDirection.get(
        literal as Exclude<CanonicalBusFanoutDirection, "center">,
      )
      if (!geometry) {
        throw new Error(
          `Orbit-aware fanout requires canonical directions; bus "${busId}" uses "${literal}"`,
        )
      }
      return [{ busId, direction: direction as BusFanoutDirection, geometry }]
    },
  )
  const baseEdges = new Set(
    canonicalEntries.map(({ geometry }) => geometry.edge),
  )
  if (baseEdges.size !== 1) {
    throw new Error(
      "Orbit-aware fanout base directions must all use the same physical edge",
    )
  }
  const baseEdge = baseEdges.values().next().value as CardinalEdge | undefined
  if (!baseEdge) return { ...baseDirections }
  const targetEdge = getTargetEdge(sourceComponentCenter, targetComponentCenter)
  const quarterTurnsCounterclockwise =
    (EDGE_CYCLE.indexOf(targetEdge) - EDGE_CYCLE.indexOf(baseEdge) + 4) % 4

  return Object.fromEntries(
    Object.entries(baseDirections).map(([busId, direction]) => {
      const typedDirection = direction as BusFanoutDirection
      const literal = getDirectionLiteral(typedDirection)
      const rotatedLiteral = rotateCanonicalDirection(
        literal as CanonicalBusFanoutDirection,
        quarterTurnsCounterclockwise,
      )
      return [
        busId,
        typeof typedDirection === "string"
          ? rotatedLiteral
          : { ...typedDirection, direction: rotatedLiteral },
      ]
    }),
  ) as Record<BusId, BusFanoutDirection>
}
