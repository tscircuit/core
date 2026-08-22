import type {
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

/** Adapt Core's canonical implicit-breakout contract to the winding solver. */
export const defaultImplicitBreakoutPointSolverFn: ImplicitBreakoutPointSolverFn =
  (input) => {
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
