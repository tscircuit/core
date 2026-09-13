import type {
  ImplicitBreakoutConnectionOrDifferentialPair,
  ImplicitBreakoutEdge,
  ImplicitBreakoutConnection,
  ImplicitBreakoutPointSolverFn,
} from "@tscircuit/props"
import {
  WindingBreakoutSolver,
  type WindingBreakoutSolverInput,
  type ConnectionInput as WindingConnectionInput,
} from "@tscircuit/winding-breakout-point-solver"

const toWindingConnection = (
  connection: ImplicitBreakoutConnection,
): WindingConnectionInput => ({
  id: connection.connectionId,
  endpoints: connection.endpoints,
})

const getConnectionIds = (
  connection: ImplicitBreakoutConnectionOrDifferentialPair,
): string[] =>
  "type" in connection
    ? connection.connections.map(({ connectionId }) => connectionId)
    : [connection.connectionId]

const solveWindingInput = (input: WindingBreakoutSolverInput) => {
  const solver = new WindingBreakoutSolver(input)
  solver.solve()
  return solver.getOutput().breakoutPoints
}

const getNearestEdge = ({
  position,
  bounds,
  preferredEdge,
}: {
  position: { x: number; y: number }
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
  preferredEdge: ImplicitBreakoutEdge
}): ImplicitBreakoutEdge => {
  const distances: Record<ImplicitBreakoutEdge, number> = {
    left: position.x - bounds.minX,
    right: bounds.maxX - position.x,
    bottom: position.y - bounds.minY,
    top: bounds.maxY - position.y,
  }
  const edges: ImplicitBreakoutEdge[] = [
    preferredEdge,
    "left",
    "right",
    "bottom",
    "top",
  ]
  return edges.reduce((nearestEdge, edge) =>
    distances[edge] < distances[nearestEdge] ? edge : nearestEdge,
  )
}

/**
 * Keep declared buses and differential pairs together while assigning a
 * single-region fanout to the boundary edges nearest its source pads.
 */
const getSingleRegionConnectionEdges = (
  input: Parameters<ImplicitBreakoutPointSolverFn>[0],
): ReadonlyMap<string, ImplicitBreakoutEdge> => {
  const region = input.regions[0]!
  const connectionById = new Map<string, ImplicitBreakoutConnection>()
  const relatedConnectionIds = new Map<string, Set<string>>()
  const connectIds = (connectionIds: readonly string[]) => {
    for (const connectionId of connectionIds) {
      const relatedIds = relatedConnectionIds.get(connectionId) ?? new Set()
      relatedConnectionIds.set(connectionId, relatedIds)
      for (const relatedId of connectionIds) relatedIds.add(relatedId)
    }
  }
  for (const connection of input.connections) {
    if ("type" in connection) {
      for (const member of connection.connections) {
        connectionById.set(member.connectionId, member)
      }
      connectIds(getConnectionIds(connection))
    } else {
      connectionById.set(connection.connectionId, connection)
      connectIds([connection.connectionId])
    }
  }
  for (const bus of input.buses) connectIds(bus.connectionIds)

  const edgeByConnectionId = new Map<string, ImplicitBreakoutEdge>()
  const visitedConnectionIds = new Set<string>()
  for (const connectionId of connectionById.keys()) {
    if (visitedConnectionIds.has(connectionId)) continue
    const groupedConnectionIds: string[] = []
    const pendingConnectionIds = [connectionId]
    while (pendingConnectionIds.length > 0) {
      const pendingConnectionId = pendingConnectionIds.pop()!
      if (visitedConnectionIds.has(pendingConnectionId)) continue
      visitedConnectionIds.add(pendingConnectionId)
      groupedConnectionIds.push(pendingConnectionId)
      for (const relatedConnectionId of
        relatedConnectionIds.get(pendingConnectionId) ?? []) {
        if (!visitedConnectionIds.has(relatedConnectionId)) {
          pendingConnectionIds.push(relatedConnectionId)
        }
      }
    }
    const positions = groupedConnectionIds.map((groupedConnectionId) => {
      const connection = connectionById.get(groupedConnectionId)!
      const endpoint = connection.endpoints.find(
        ({ regionId }) => regionId === region.regionId,
      )
      if (!endpoint) {
        throw new Error(
          `Connection "${groupedConnectionId}" is missing endpoint for region "${region.regionId}"`,
        )
      }
      return endpoint.position
    })
    const center = positions.reduce(
      (sum, position) => ({
        x: sum.x + position.x / positions.length,
        y: sum.y + position.y / positions.length,
      }),
      { x: 0, y: 0 },
    )
    const edge = getNearestEdge({
      position: center,
      bounds: region.bounds,
      preferredEdge: region.edge,
    })
    for (const groupedConnectionId of groupedConnectionIds) {
      edgeByConnectionId.set(groupedConnectionId, edge)
    }
  }
  return edgeByConnectionId
}

const toWindingInput = (
  input: Parameters<ImplicitBreakoutPointSolverFn>[0],
): WindingBreakoutSolverInput => ({
  regions: input.regions.map((region) => ({
    id: region.regionId,
    bounds: region.bounds,
    edge: region.edge,
  })),
  connections: input.connections.map((connection) =>
    "type" in connection
      ? {
          type: "differential" as const,
          connections: connection.connections.map(toWindingConnection) as [
            WindingConnectionInput,
            WindingConnectionInput,
          ],
        }
      : toWindingConnection(connection),
  ),
  buses: input.buses.map((bus) => ({
    id: bus.busId,
    connectionIds: bus.connectionIds,
    preferredLayers: bus.targetLayers,
  })),
  boundaryPointSpacing: input.boundaryPointSpacing,
})

/** Adapt Core's canonical implicit-breakout contract to the winding solver. */
export const defaultImplicitBreakoutPointSolverFn: ImplicitBreakoutPointSolverFn =
  (input) => {
    const windingInput = toWindingInput(input)
    if (input.regions.length !== 1) {
      return { breakoutPoints: solveWindingInput(windingInput) }
    }

    const edgeByConnectionId = getSingleRegionConnectionEdges(input)
    const usedEdges = new Set(edgeByConnectionId.values())
    if (usedEdges.size === 1) {
      return { breakoutPoints: solveWindingInput(windingInput) }
    }

    const breakoutPoints = [...usedEdges].flatMap((edge) => {
      const connections = input.connections.filter((connection) =>
        getConnectionIds(connection).every(
          (connectionId) => edgeByConnectionId.get(connectionId) === edge,
        ),
      )
      const connectionIds = new Set(connections.flatMap(getConnectionIds))
      return solveWindingInput({
        ...toWindingInput({ ...input, connections }),
        regions: [{ ...windingInput.regions[0]!, edge }],
        buses: windingInput.buses.filter((bus) =>
          bus.connectionIds.every((connectionId) =>
            connectionIds.has(connectionId),
          ),
        ),
      })
    })
    return { breakoutPoints }
  }
