import type { AutoroutingPipelineSolver11_Simplification } from "@tscircuit/capacity-autorouter"
import type { PcbTraceId } from "./SimpleRouteJson"

/**
 * Keep fixed copper in Pipeline 11's immutable routes before cleanup starts.
 * Routes retain board-world point coordinates in mm: +X right, +Y up,
 * +Z above the board (right-handed). No geometry is transformed here.
 */
export function preserveFixedSimplificationTraces(
  solver: AutoroutingPipelineSolver11_Simplification,
  fixedPcbTraceIds: ReadonlySet<PcbTraceId>,
): void {
  if (fixedPcbTraceIds.size === 0) return
  // Pipeline 11 exposes pipelineDef hooks. PrepareTraceSimplificationSolver
  // builds mutableHdRoutes; TraceSimplificationStageSolver consumes them with
  // immutableHdRoutes as exact collision geometry. ApplyTraceSimplificationSolver
  // returns originalTrace verbatim when mutableHdRoute is absent.
  const prepareStep = solver.pipelineDef.find(
    (step) => step.solverName === "prepareTraceSimplificationSolver",
  )!
  const onPrepared = prepareStep.onSolved
  prepareStep.onSolved = () => {
    onPrepared?.(solver)
    const prepared = solver.prepareTraceSimplificationSolver!.getOutput()
    const fixedHdRoutes = new Set(
      prepared.preparedTraces.flatMap((trace) => {
        if (
          !fixedPcbTraceIds.has(trace.originalTrace.pcb_trace_id) ||
          !trace.mutableHdRoute
        )
          return []
        const fixedHdRoute = trace.mutableHdRoute
        trace.mutableHdRoute = undefined
        return [fixedHdRoute]
      }),
    )
    prepared.immutableHdRoutes.push(...fixedHdRoutes)
    prepared.mutableHdRoutes = prepared.mutableHdRoutes.filter(
      (route) => !fixedHdRoutes.has(route),
    )
  }
}
