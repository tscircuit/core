import type {
  ImplicitBreakoutConnection,
  ImplicitBreakoutPointSolverFn,
} from "@tscircuit/props"
import {
  WindingBreakoutInfeasibleError,
  WindingBreakoutSolver,
  type WindingBreakoutSolverInput,
  type ConnectionInput as WindingConnectionInput,
} from "@tscircuit/winding-breakout-point-solver"
import {
  ImplicitBreakoutBankInfeasibleError,
  type ImplicitBreakoutBankPlanningContext,
  planImplicitBreakoutBanks,
} from "./plan-implicit-breakout-banks"
import { planImplicitBreakoutBusLayers } from "./plan-implicit-breakout-bus-layers"

const toWindingConnection = (
  connection: ImplicitBreakoutConnection,
): WindingConnectionInput => ({
  id: connection.connectionId,
  endpoints: connection.endpoints,
})

/** Adapt Core's canonical implicit-breakout contract to the winding solver. */
export const solveDefaultImplicitBreakoutPoints = (
  input: Parameters<ImplicitBreakoutPointSolverFn>[0],
  bankPlanningContext?: ImplicitBreakoutBankPlanningContext,
): ReturnType<ImplicitBreakoutPointSolverFn> => {
    const baseWindingInput = {
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
      boundaryPointSpacing: input.boundaryPointSpacing,
    }

    let lastInfeasibleError:
      | WindingBreakoutInfeasibleError
      | ImplicitBreakoutBankInfeasibleError
      | undefined
    const candidatePlans = planImplicitBreakoutBusLayers(input.buses)
    for (const plan of candidatePlans) {
      const layerByBusId = new Map(
        plan.assignments.map((assignment) => [
          assignment.busId,
          assignment.selectedLayer,
        ]),
      )
      const windingInput = {
        ...baseWindingInput,
        buses: input.buses.map((bus) => ({
          id: bus.busId,
          connectionIds: bus.connectionIds,
          preferredLayer: layerByBusId.get(bus.busId),
        })),
      } satisfies WindingBreakoutSolverInput

      try {
        const solver = new WindingBreakoutSolver(windingInput)
        solver.solve()
        const baseOutput = solver.getOutput()
        if (!bankPlanningContext) return baseOutput
        return planImplicitBreakoutBanks({
          input,
          baseOutput,
          context: bankPlanningContext,
        })
      } catch (error) {
        if (
          !(error instanceof WindingBreakoutInfeasibleError) &&
          !(error instanceof ImplicitBreakoutBankInfeasibleError)
        ) {
          throw error
        }
        lastInfeasibleError = error
      }
    }
    throw (
      lastInfeasibleError ??
      new WindingBreakoutInfeasibleError(
        "WindingBreakoutSolver: no whole-bus layer plan is feasible",
      )
    )
  }

export const defaultImplicitBreakoutPointSolverFn: ImplicitBreakoutPointSolverFn =
  (input) => solveDefaultImplicitBreakoutPoints(input)
