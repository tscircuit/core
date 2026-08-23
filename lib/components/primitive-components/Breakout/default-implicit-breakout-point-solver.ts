import type {
  ImplicitBreakoutConnection,
  ImplicitBreakoutEdge,
  ImplicitBreakoutPointSolverFn,
  ImplicitBreakoutPointSolverInput,
  ImplicitBreakoutPointSolverOutput,
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
  connection: ImplicitBreakoutPointSolverInput["connections"][number],
): string[] =>
  "type" in connection
    ? connection.connections.map((member) => member.connectionId)
    : [connection.connectionId]

const solveWithWindingSolver = (
  input: ImplicitBreakoutPointSolverInput,
): ImplicitBreakoutPointSolverOutput => {
  const windingInput = {
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
  } satisfies WindingBreakoutSolverInput

  const solver = new WindingBreakoutSolver(windingInput)
  solver.solve()
  return solver.getOutput()
}

const getPreferredEdgesForStandaloneConnections = ({
  input,
  preferredEdgeByConnectionId,
}: {
  input: ImplicitBreakoutPointSolverInput
  preferredEdgeByConnectionId: ReadonlyMap<string, ImplicitBreakoutEdge>
}): Map<string, ImplicitBreakoutEdge> => {
  const fallbackEdge = input.regions[0]!.edge
  const groupedConnectionIds = new Set(
    input.buses.flatMap((bus) => bus.connectionIds),
  )
  for (const connection of input.connections) {
    if ("type" in connection) {
      for (const connectionId of getConnectionIds(connection)) {
        groupedConnectionIds.add(connectionId)
      }
    }
  }
  return new Map(
    input.connections.flatMap((connection) =>
      getConnectionIds(connection).map(
        (connectionId) =>
          [
            connectionId,
            groupedConnectionIds.has(connectionId)
              ? fallbackEdge
              : (preferredEdgeByConnectionId.get(connectionId) ?? fallbackEdge),
          ] as const,
      ),
    ),
  )
}

const shiftBreakoutPointsTowardExternalTargets = ({
  breakoutPoints,
  edge,
  bounds,
  externalTargetByConnectionId,
}: {
  breakoutPoints: ImplicitBreakoutPointSolverOutput["breakoutPoints"]
  edge: ImplicitBreakoutEdge
  bounds: ImplicitBreakoutPointSolverInput["regions"][number]["bounds"]
  externalTargetByConnectionId: ReadonlyMap<string, { x: number; y: number }>
}): ImplicitBreakoutPointSolverOutput["breakoutPoints"] => {
  const vertical = edge === "left" || edge === "right"
  const axisMinimum = vertical ? bounds.minY : bounds.minX
  const axisMaximum = vertical ? bounds.maxY : bounds.maxX
  const targetAxes = breakoutPoints.flatMap((point) => {
    const target = externalTargetByConnectionId.get(point.connectionId)
    return target ? [vertical ? target.y : target.x] : []
  })
  if (targetAxes.length === 0 || breakoutPoints.length === 0) {
    return breakoutPoints
  }
  const currentAxes = breakoutPoints.map((point) =>
    vertical ? point.y : point.x,
  )
  const desiredCenter =
    targetAxes.reduce((sum, axis) => sum + axis, 0) / targetAxes.length
  const currentCenter =
    currentAxes.reduce((sum, axis) => sum + axis, 0) / currentAxes.length
  const minimumShift = axisMinimum - Math.min(...currentAxes)
  const maximumShift = axisMaximum - Math.max(...currentAxes)
  const shift = Math.max(
    minimumShift,
    Math.min(maximumShift, desiredCenter - currentCenter),
  )
  return breakoutPoints.map((point) => ({
    ...point,
    ...(vertical ? { y: point.y + shift } : { x: point.x + shift }),
  }))
}

export const solveDefaultImplicitBreakoutPoints = ({
  input,
  preferredEdgeByConnectionId,
  externalTargetByConnectionId,
}: {
  input: ImplicitBreakoutPointSolverInput
  preferredEdgeByConnectionId?: ReadonlyMap<string, ImplicitBreakoutEdge>
  externalTargetByConnectionId?: ReadonlyMap<string, { x: number; y: number }>
}): ImplicitBreakoutPointSolverOutput => {
  const baselineOutput = solveWithWindingSolver(input)
  if (input.regions.length !== 1 || !preferredEdgeByConnectionId?.size) {
    return baselineOutput
  }

  const region = input.regions[0]!
  const constrainedEdges = getPreferredEdgesForStandaloneConnections({
    input,
    preferredEdgeByConnectionId,
  })
  const connectionCountByEdge = new Map<ImplicitBreakoutEdge, number>()
  for (const edge of constrainedEdges.values()) {
    connectionCountByEdge.set(edge, (connectionCountByEdge.get(edge) ?? 0) + 1)
  }
  // Keep dense fanouts on the winding solver's shared edge. A singleton
  // outlier may use its nearer edge when at least two routes retain the
  // original edge, which avoids long cross-region escapes without weakening
  // the baseline feasibility check above.
  const fallbackConnectionCount = connectionCountByEdge.get(region.edge) ?? 0
  if (fallbackConnectionCount < 2) {
    for (const connectionId of constrainedEdges.keys()) {
      constrainedEdges.set(connectionId, region.edge)
    }
  } else {
    for (const [connectionId, edge] of constrainedEdges) {
      if (edge !== region.edge && (connectionCountByEdge.get(edge) ?? 0) > 1) {
        constrainedEdges.set(connectionId, region.edge)
      }
    }
  }
  const selectedEdges = new Set(constrainedEdges.values())
  if (selectedEdges.size === 1) return baselineOutput
  const connectionGroupsByEdge = new Map<
    ImplicitBreakoutEdge,
    typeof input.connections
  >()
  for (const connection of input.connections) {
    const edge =
      constrainedEdges.get(getConnectionIds(connection)[0]!) ?? region.edge
    const connections = connectionGroupsByEdge.get(edge) ?? []
    connectionGroupsByEdge.set(edge, [...connections, connection])
  }

  const breakoutPoints = [...connectionGroupsByEdge.entries()].flatMap(
    ([edge, connections]) => {
      const connectionIds = new Set(connections.flatMap(getConnectionIds))
      const output = solveWithWindingSolver({
        ...input,
        regions: [{ ...region, edge }],
        connections,
        buses: input.buses.filter((bus) =>
          bus.connectionIds.every((connectionId) =>
            connectionIds.has(connectionId),
          ),
        ),
      })
      const allConnectionsPreferSelectedEdge = [...connectionIds].every(
        (connectionId) =>
          preferredEdgeByConnectionId.get(connectionId) === edge,
      )
      if (
        !allConnectionsPreferSelectedEdge ||
        !externalTargetByConnectionId?.size
      ) {
        return output.breakoutPoints
      }
      return shiftBreakoutPointsTowardExternalTargets({
        breakoutPoints: output.breakoutPoints,
        edge,
        bounds: region.bounds,
        externalTargetByConnectionId,
      })
    },
  )
  return { breakoutPoints }
}

/** Adapt Core's canonical implicit-breakout contract to the winding solver. */
export const defaultImplicitBreakoutPointSolverFn: ImplicitBreakoutPointSolverFn =
  (input) => solveDefaultImplicitBreakoutPoints({ input })
