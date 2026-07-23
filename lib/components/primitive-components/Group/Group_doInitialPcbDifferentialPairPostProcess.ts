import type { SubcircuitGroupProps } from "@tscircuit/props"
import { SOLVERS } from "lib/solvers"
import type {
  SimpleRouteDifferentialPair,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { applyDifferentialPairSolverOutput } from "lib/utils/autorouting/differential-pair-post-processing/apply-differential-pair-solver-output"
import {
  getDifferentialPairConnectionNames,
  getSimplifiedPcbTraceConnectionName,
  validateDifferentialPairSolverOutput,
} from "lib/utils/autorouting/differential-pair-post-processing/validate-differential-pair-solver-output"
import type { DifferentialPair } from "../DifferentialPair"
import type { Group } from "./Group"
import { getExistingSimplifiedPcbTracesForReroute } from "./region-replacement/get-existing-simplified-pcb-traces-for-reroute"

const buildCompleteRoutedSimpleRouteJson = (
  group: Group<any>,
): SimpleRouteJson => {
  const db = group.root!.db
  const props = group._parsedProps as SubcircuitGroupProps
  const minTraceWidth = Number(props.minTraceWidth ?? 0.15)
  const nominalTraceWidth = Number(
    props.defaultTraceWidth ?? props.nominalTraceWidth ?? minTraceWidth,
  )
  const circuitJsonWithoutRoutedCopper = db
    .toArray()
    .filter((circuitElement) => {
      if (
        circuitElement.type === "pcb_trace" &&
        circuitElement.source_trace_id
      ) {
        return false
      }
      if (circuitElement.type === "pcb_via" && circuitElement.pcb_trace_id) {
        return false
      }
      return true
    })
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutRoutedCopper,
    minTraceWidth,
    nominalTraceWidth,
    subcircuit_id: group.subcircuit_id,
    subcircuitComponent: group,
  })

  return {
    ...simpleRouteJson,
    traces: getExistingSimplifiedPcbTracesForReroute(group),
  }
}

const insertDifferentialPairPostProcessError = ({
  group,
  error,
  simpleRouteJson,
  differentialPairs,
}: {
  group: Group<any>
  error: unknown
  simpleRouteJson: SimpleRouteJson
  differentialPairs: readonly SimpleRouteDifferentialPair[]
}): void => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const differentialPairContext = differentialPairs
    .map((differentialPair) => differentialPair.connectionNames.join("/"))
    .join(", ")
  const message = `Differential-pair post-processing failed for subcircuit "${group.name ?? group.subcircuit_id ?? "unnamed"}" (${differentialPairContext}): ${errorMessage}`
  const pcbErrorId = `pcb_differential_pair_post_process_${group.subcircuit_id}`
  const existingError = group.root!.db.pcb_autorouting_error.get(pcbErrorId)
  if (existingError) {
    group.root!.db.pcb_autorouting_error.update(pcbErrorId, { message })
  } else {
    group.root!.db.pcb_autorouting_error.insert({
      pcb_error_id: pcbErrorId,
      error_type: "pcb_autorouting_error",
      message,
    })
  }
  group.root?.emit("autorouting:error", {
    subcircuit_id: group.subcircuit_id!,
    componentDisplayName: group.getString(),
    error: {
      message,
      ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
    },
    simpleRouteJson,
  })
}

export const Group_doInitialPcbDifferentialPairPostProcess = (
  group: Group<any>,
): void => {
  if (!group.isSubcircuit) return
  if (group.root?.pcbDisabled) return
  if (
    group.root?.pcbRoutingDisabled ||
    group.getInheritedProperty("routingDisabled")
  ) {
    return
  }
  if (group._isInflatedFromCircuitJson) return

  const differentialPairDeclarations =
    group.selectAll<DifferentialPair>("differentialpair")
  if (differentialPairDeclarations.length === 0) return

  const simpleRouteJson = buildCompleteRoutedSimpleRouteJson(group)
  const differentialPairs = simpleRouteJson.differentialPairs
  if (!differentialPairs || differentialPairs.length === 0) return

  const differentialPairConnectionNames =
    getDifferentialPairConnectionNames(differentialPairs)
  const hasRoutedDifferentialPairTrace = (simpleRouteJson.traces ?? []).some(
    (trace) =>
      differentialPairConnectionNames.has(
        getSimplifiedPcbTraceConnectionName(trace),
      ),
  )
  if (!hasRoutedDifferentialPairTrace) return

  group._queueAsyncEffect(
    "differential-pair-post-processing",
    async (): Promise<void> => {
      try {
        group.root?.emit("solver:started", {
          type: "solver:started",
          solverName: "DifferentialPairSolver",
          solverParams: {
            simpleRouteJson,
            differentialPairs,
          },
          componentName: group.getString(),
        })
        const solver = new SOLVERS.DifferentialPairSolver(
          simpleRouteJson,
          differentialPairs,
        )
        solver.solve()
        const outputSimpleRouteJson = solver.getOutput() as SimpleRouteJson
        validateDifferentialPairSolverOutput({
          inputSimpleRouteJson: simpleRouteJson,
          outputSimpleRouteJson,
          differentialPairs,
        })
        applyDifferentialPairSolverOutput({
          group,
          inputSimpleRouteJson: simpleRouteJson,
          outputSimpleRouteJson,
          differentialPairs,
        })
      } catch (error) {
        insertDifferentialPairPostProcessError({
          group,
          error,
          simpleRouteJson,
          differentialPairs,
        })
      }
    },
  )
}
