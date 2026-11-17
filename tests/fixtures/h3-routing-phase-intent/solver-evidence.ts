import { isDeepStrictEqual } from "node:util"
import type { SolverName } from "lib/solvers"
import type { H3RoutingStage } from "./run"

/** Correlate actual solver observations with the native board's routing phases.
 * This is event identity and order evidence; it carries no geometry.
 * The complete timeline retains the board's layout solver before routing.
 */
export const hasNativeH3RoutingSolverEvidence = ({
  stages,
  solverNames,
}: {
  stages: readonly H3RoutingStage[]
  solverNames: readonly SolverName[]
}): boolean => {
  const routingSolvers: SolverName[] = [
    "BusLanesPipelineSolver",
    "BusLanesPipelineSolver",
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  ]
  if (
    stages.length !== routingSolvers.length ||
    !isDeepStrictEqual(solverNames, ["LayoutPipelineSolver", ...routingSolvers])
  )
    return false
  const phaseNames = ["byte0", "byte1", "remaining"]
  return stages.every((stage, stageIndex) => {
    const solverName = routingSolvers[stageIndex]
    const solverEvents = stage.solverEvents ?? []
    // Bus adapters emit a solver end report. The capacity adapter currently
    // emits its constructor observation and terminates through autorouting
    // end/error, so no synthetic solver:ended event is required for Pipeline9.
    const expectedEvents = stageIndex < 2
      ? ["solver:started", "solver:ended"]
      : ["solver:started"]
    if (
      stage.start.phaseName !== phaseNames[stageIndex] ||
      stage.start._actualRoutingPhaseOrderIndex !== stageIndex ||
      stage.start.routingPhaseIndex !== stageIndex ||
      stage.start.solverName !== solverName ||
      !isDeepStrictEqual(solverEvents.map((event) => event.type), expectedEvents) ||
      !solverEvents.every((event) => {
        return (
          event.solverName === solverName &&
          event.componentName === stage.start.componentDisplayName
        )
      }) ||
      (stage.end && stage.error)
    )
      return false
    const terminal = stage.end ?? stage.error
    if (!terminal) return false
    return (
      terminal.subcircuit_id === stage.start.subcircuit_id &&
      terminal.componentDisplayName === stage.start.componentDisplayName &&
      terminal.phaseName === stage.start.phaseName &&
      terminal.phaseStageIndex === stage.start.phaseStageIndex &&
      terminal.phaseStageCount === stage.start.phaseStageCount &&
      terminal.phaseOrdinal === stage.start.phaseOrdinal &&
      terminal.phaseCount === stage.start.phaseCount &&
      terminal.routingPhaseIndex === stage.start.routingPhaseIndex &&
      terminal._actualRoutingPhaseOrderIndex ===
        stage.start._actualRoutingPhaseOrderIndex &&
      terminal.solverName === stage.start.solverName
    )
  })
}
