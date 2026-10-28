import {
  type BusFanoutDirection,
  type CanonicalBusFanoutDirection,
  type ImplicitBreakoutBounds as Bounds,
  type ImplicitBreakoutEdge as BreakoutEdge,
  canonicalBusFanoutDirectionValues,
} from "@tscircuit/props"

/**
 * Position along a breakout edge, measured in the edge's increasing axis
 * direction (+X for top/bottom edges, +Y for left/right edges).
 */
export type BreakoutEdgeBand = "start" | "center" | "end"

export interface SingleRegionEdgeGroup {
  edge: BreakoutEdge
  band?: BreakoutEdgeBand
  connectionIds: readonly string[]
}

interface Point {
  x: number
  y: number
}

const EDGES: readonly BreakoutEdge[] = ["right", "left", "top", "bottom"]

export const isVerticalBreakoutEdge = (edge: BreakoutEdge): boolean =>
  edge === "left" || edge === "right"

export const getBreakoutEdgeLength = (
  bounds: Bounds,
  edge: BreakoutEdge,
): number =>
  isVerticalBreakoutEdge(edge)
    ? bounds.maxY - bounds.minY
    : bounds.maxX - bounds.minX

const canonicalBusFanoutDirections = new Set<string>(
  canonicalBusFanoutDirectionValues,
)

/**
 * Map an edge-first fanout direction such as `leftside_bottom` to the breakout
 * edge and the band along it. Legacy NinePointAnchor names and `center` stay
 * destination-guided and return undefined.
 */
export const getBreakoutEdgeForFanoutDirection = (
  fanoutDirection: BusFanoutDirection,
): { edge: BreakoutEdge; band: BreakoutEdgeBand } | undefined => {
  const direction =
    typeof fanoutDirection === "string"
      ? fanoutDirection
      : fanoutDirection.direction
  if (direction === "center" || !canonicalBusFanoutDirections.has(direction)) {
    return undefined
  }
  const [side, position] = (direction as CanonicalBusFanoutDirection).split(
    "side_",
  ) as [BreakoutEdge, string]
  if (position === "center") return { edge: side, band: "center" }
  const startPosition = isVerticalBreakoutEdge(side) ? "bottom" : "left"
  return { edge: side, band: position === startPosition ? "start" : "end" }
}

const distanceFromPointToEdge = (
  bounds: Bounds,
  target: Point,
  edge: BreakoutEdge,
): number => {
  const edgePoint = isVerticalBreakoutEdge(edge)
    ? {
        x: edge === "left" ? bounds.minX : bounds.maxX,
        y: Math.max(bounds.minY, Math.min(bounds.maxY, target.y)),
      }
    : {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, target.x)),
        y: edge === "bottom" ? bounds.minY : bounds.maxY,
      }
  return Math.hypot(target.x - edgePoint.x, target.y - edgePoint.y)
}

/**
 * Choose an exit edge for every connection of a single-region breakout instead
 * of sending every connection out of one shared edge. Each connection prefers
 * the edge that minimizes its escape length plus the distance from that edge
 * to its nearest external destination. Differential pairs and buses move as a
 * unit, and buses with an edge-first `busFanoutDirections` entry are pinned to
 * that edge and band. Edges that exceed their estimated capacity spill the
 * cheapest-to-move units onto edges with room.
 */
export const assignSingleRegionBreakoutEdges = ({
  bounds,
  connectionIds,
  pinPositionByConnectionId,
  externalPositionsByConnectionId,
  atomicGroups,
  buses,
  busFanoutDirections,
  fallbackEdge,
  boundaryPointSpacing,
  layerCount,
}: {
  bounds: Bounds
  connectionIds: readonly string[]
  pinPositionByConnectionId: ReadonlyMap<string, Point>
  externalPositionsByConnectionId: ReadonlyMap<string, readonly Point[]>
  atomicGroups: readonly (readonly string[])[]
  buses: readonly { busId: string; connectionIds: readonly string[] }[]
  busFanoutDirections?: Readonly<Record<string, BusFanoutDirection>>
  fallbackEdge: BreakoutEdge
  boundaryPointSpacing: number
  layerCount: number
}): SingleRegionEdgeGroup[] => {
  const parent = new Map(connectionIds.map((id) => [id, id]))
  const find = (id: string): string => {
    let root = id
    while (parent.get(root) !== root) root = parent.get(root)!
    parent.set(id, root)
    return root
  }
  const union = (ids: readonly string[]) => {
    const members = ids.filter((id) => parent.has(id))
    for (const id of members.slice(1)) {
      const firstRoot = find(members[0]!)
      const root = find(id)
      if (firstRoot !== root) parent.set(root, firstRoot)
    }
  }
  for (const group of atomicGroups) union(group)
  for (const bus of buses) union(bus.connectionIds)

  const unitsByRoot = new Map<string, string[]>()
  for (const id of connectionIds) {
    const root = find(id)
    const unit = unitsByRoot.get(root) ?? []
    unit.push(id)
    unitsByRoot.set(root, unit)
  }

  const forcedPlacementByRoot = new Map<
    string,
    { edge: BreakoutEdge; band: BreakoutEdgeBand }
  >()
  for (const bus of [...buses].sort((a, b) => a.busId.localeCompare(b.busId))) {
    const fanoutDirection = busFanoutDirections?.[bus.busId]
    const firstMember = bus.connectionIds.find((id) => parent.has(id))
    if (!fanoutDirection || !firstMember) continue
    const placement = getBreakoutEdgeForFanoutDirection(fanoutDirection)
    const root = find(firstMember)
    if (placement && !forcedPlacementByRoot.has(root)) {
      forcedPlacementByRoot.set(root, placement)
    }
  }

  const regionDiagonal = Math.hypot(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
  )
  const getConnectionCost = (id: string, edge: BreakoutEdge): number => {
    const externalPositions = externalPositionsByConnectionId.get(id) ?? []
    if (externalPositions.length === 0) {
      return edge === fallbackEdge ? 0 : regionDiagonal
    }
    const pin = pinPositionByConnectionId.get(id)
    if (!pin) {
      return Math.min(
        ...externalPositions.map((position) =>
          distanceFromPointToEdge(bounds, position, edge),
        ),
      )
    }
    // Estimate the route as a straight escape from the pin to the edge, then a
    // straight run from that exit to the nearest destination. Destinations
    // inside the bounds (parts tucked next to the breakout) are measured the
    // same way, so the run back along the edge counts.
    const exit = isVerticalBreakoutEdge(edge)
      ? { x: edge === "left" ? bounds.minX : bounds.maxX, y: pin.y }
      : { x: pin.x, y: edge === "bottom" ? bounds.minY : bounds.maxY }
    return (
      Math.hypot(exit.x - pin.x, exit.y - pin.y) +
      Math.min(
        ...externalPositions.map((position) =>
          Math.hypot(position.x - exit.x, position.y - exit.y),
        ),
      )
    )
  }

  interface Unit {
    key: string
    connectionIds: string[]
    costByEdge: Map<BreakoutEdge, number>
    edge: BreakoutEdge
    band?: BreakoutEdgeBand
    forced: boolean
  }
  const units: Unit[] = [...unitsByRoot.entries()].map(([root, ids]) => {
    const costByEdge = new Map(
      EDGES.map((edge) => [
        edge,
        ids.reduce((sum, id) => sum + getConnectionCost(id, edge), 0),
      ]),
    )
    const forcedPlacement = forcedPlacementByRoot.get(root)
    const edge =
      forcedPlacement?.edge ??
      EDGES.reduce((bestEdge, candidate) =>
        costByEdge.get(candidate)! < costByEdge.get(bestEdge)!
          ? candidate
          : bestEdge,
      )
    return {
      key: ids[0]!,
      connectionIds: ids,
      costByEdge,
      edge,
      band: forcedPlacement?.band,
      forced: Boolean(forcedPlacement),
    }
  })

  // The winding solver staggers layers by half a spacing, so each layer adds
  // roughly one slot per spacing along the edge.
  const getEdgeCapacity = (edge: BreakoutEdge): number =>
    (Math.floor(getBreakoutEdgeLength(bounds, edge) / boundaryPointSpacing) +
      1) *
    Math.max(1, layerCount)
  const getEdgeLoad = (edge: BreakoutEdge): number =>
    units
      .filter((unit) => unit.edge === edge)
      .reduce((sum, unit) => sum + unit.connectionIds.length, 0)

  for (const edge of EDGES) {
    while (getEdgeLoad(edge) > getEdgeCapacity(edge)) {
      let bestMove:
        | { unit: Unit; targetEdge: BreakoutEdge; penalty: number }
        | undefined
      for (const unit of units) {
        if (unit.edge !== edge || unit.forced) continue
        for (const targetEdge of EDGES) {
          if (targetEdge === edge) continue
          if (
            getEdgeLoad(targetEdge) + unit.connectionIds.length >
            getEdgeCapacity(targetEdge)
          ) {
            continue
          }
          const penalty =
            unit.costByEdge.get(targetEdge)! - unit.costByEdge.get(edge)!
          if (
            !bestMove ||
            penalty < bestMove.penalty ||
            (penalty === bestMove.penalty &&
              unit.key.localeCompare(bestMove.unit.key) < 0)
          ) {
            bestMove = { unit, targetEdge, penalty }
          }
        }
      }
      // Nothing can move: leave the overflow for the solver to report.
      if (!bestMove) break
      bestMove.unit.edge = bestMove.targetEdge
    }
  }

  const connectionOrder = new Map(connectionIds.map((id, index) => [id, index]))
  const groups: SingleRegionEdgeGroup[] = []
  for (const edge of EDGES) {
    for (const band of [undefined, "start", "center", "end"] as const) {
      const groupConnectionIds = units
        .filter((unit) => unit.edge === edge && unit.band === band)
        .flatMap((unit) => unit.connectionIds)
        .sort((a, b) => connectionOrder.get(a)! - connectionOrder.get(b)!)
      if (groupConnectionIds.length === 0) continue
      groups.push({
        edge,
        ...(band ? { band } : {}),
        connectionIds: groupConnectionIds,
      })
    }
  }
  return groups
}
