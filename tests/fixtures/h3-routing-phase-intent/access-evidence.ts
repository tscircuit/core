import { isDeepStrictEqual } from "node:util"
import type { SolverName } from "lib/solvers"
import { getBusLanesInputFromSrj } from "lib/utils/autorouting/get-bus-lanes-input-from-srj"
import type { H3RoutingStage } from "./run"

/** Native fixture coverage and accepted bus evidence, shared by the unit and
 * diagnostic verdict. Counts cover every explicitly pending native terminal.
 * An initially inaccessible terminal is reported, never silently counted as
 * accessible and never treated as a newly introduced access failure.
 */
export const getNativeH3AccessEvidence = ({
  stages,
  solverNames,
}: {
  stages: H3RoutingStage[]
  solverNames: readonly SolverName[]
}) => {
  const expectedSolvers: SolverName[] = [
    "BusLanesPipelineSolver",
    "BusLanesPipelineSolver",
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  ]
  const phaseOrderVerified = isDeepStrictEqual(
    stages.map((stage) => stage.start.phaseName),
    ["byte0", "byte1", "remaining"],
  )
  const solverOrderVerified =
    isDeepStrictEqual(
      stages.map((stage) => stage.start.solverName),
      expectedSolvers,
    ) && isDeepStrictEqual(solverNames, expectedSolvers)
  const futureRequestsVerified = isDeepStrictEqual(
    stages.map((stage) =>
      stage.start.simpleRouteJson.pendingRoutingAccess?.map(
        (access) => access.connections.length,
      ),
    ),
    [[8, 37], [37], undefined],
  )
  const solverInputVerified =
    stages.length === 3 &&
    stages
      .slice(0, 2)
      .every(
        (stage) =>
          stage.announcedConstructorInputMatches === true &&
          isDeepStrictEqual(
            stage.observedBusInput,
            getBusLanesInputFromSrj(stage.start.simpleRouteJson),
          ),
      )
  const reportsVerified =
    stages.length === 3 &&
    stages.slice(0, 2).every((stage, stageIndex) => {
      const ended = stage.solverEnded
      const report = ended?.pendingRoutingAccessReport
      const expectedConnections = [45, 37][stageIndex]!
      const expectedTerminals = [92, 76][stageIndex]!
      if (
        !stage.end ||
        !ended?.solved ||
        ended.failed ||
        ended.error !== null ||
        !report ||
        report.outcome !== "preserved" ||
        report.declaredConnectionCount !== expectedConnections ||
        report.declaredTerminalCount !== expectedTerminals ||
        report.framedTerminalCount !== expectedTerminals ||
        report.newlyBlockedConnectionNames.length !== 0
      )
        return false
      const accessible = report.baselineAccessibleFramedTerminalCount
      const inaccessible = report.baselineInaccessibleFramedTerminalCount
      if (
        !Number.isInteger(accessible) ||
        !Number.isInteger(inaccessible) ||
        accessible < 0 ||
        inaccessible < 0 ||
        accessible + inaccessible !== expectedTerminals
      )
        return false
      const { traces: prior = [], ...inputProblem } =
        stage.start.simpleRouteJson
      const { traces: final = [], ...outputProblem } = stage.end.simpleRouteJson
      if (
        !isDeepStrictEqual(inputProblem, outputProblem) ||
        !prior.every((trace) =>
          isDeepStrictEqual(
            final.find(
              (candidate) => candidate.pcb_trace_id === trace.pcb_trace_id,
            ),
            trace,
          ),
        )
      )
        return false
      const priorIds = new Set(prior.map((trace) => trace.pcb_trace_id))
      // Adapter.complete supplies the actual solver.traces; Core only accumulates
      // unchanged input copper for the stage event. Include physical input
      // fragments once, instead of counting materialized Circuit JSON rows.
      const unionIds = new Set([
        ...(stage.observedBusInput?.traces ?? []).map(
          (trace) => trace.pcb_trace_id,
        ),
        ...final
          .filter((trace) => !priorIds.has(trace.pcb_trace_id))
          .map((trace) => trace.pcb_trace_id),
      ])
      return report.validatedTraceCount === unionIds.size
    }) &&
    stages[2]?.solverEnded?.pendingRoutingAccessReport === undefined
  return {
    phaseOrderVerified,
    solverOrderVerified,
    futureRequestsVerified,
    solverInputVerified,
    reportsVerified,
  }
}
