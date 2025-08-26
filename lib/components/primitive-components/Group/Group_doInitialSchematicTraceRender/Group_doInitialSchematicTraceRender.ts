import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import Debug from "debug"
import { createSchematicTraceSolverInputProblem } from "./createSchematicTraceSolverInputProblem"
import { applyTracesFromSolverOutput } from "./applyTracesFromSolverOutput"
import { applyNetLabelPlacements } from "./applyNetLabelPlacements"
import { insertNetLabelsForTracesExcludedFromRouting } from "./insertNetLabelsForTracesExcludedFromRouting"
import { insertNetLabelsForPortsMissingTrace } from "./insertNetLabelsForPortsMissingTrace"

const debug = Debug("Group_doInitialSchematicTraceRender")

/**
 * Render all traces within this subcircuit
 */
export const Group_doInitialSchematicTraceRender = (group: Group<any>) => {
  if (!group.isSubcircuit) return
  if (group.root?.schematicDisabled) return

  // Prepare the solver input and context
  const {
    inputProblem,
    pinIdToSchematicPortId,
    pairKeyToSourceTraceId,
    sckToSourceNet,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    displayLabelTraces,
    allScks,
    userNetIdToSck,
  } = createSchematicTraceSolverInputProblem(group)

  // Optional debug output
  if (debug.enabled) {
    globalThis.debugOutputs?.add(
      "group-trace-render-input-problem",
      JSON.stringify(inputProblem, null, 2),
    )
  }

  // Solve routing
  const solver = new SchematicTracePipelineSolver(inputProblem)
  solver.solve()

  // Apply traces
  applyTracesFromSolverOutput({
    group,
    solver,
    pinIdToSchematicPortId,
    pairKeyToSourceTraceId,
  })

  // Apply net labels (from solver placements and net-only ports)
  applyNetLabelPlacements({
    group,
    solver,
    sckToSourceNet,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    allScks,
    userNetIdToSck,
  })

  insertNetLabelsForPortsMissingTrace({
    group,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    sckToSourceNet,
  })

  // Insert labels for traces that explicitly asked for schDisplayLabel
  insertNetLabelsForTracesExcludedFromRouting({
    group,
    solver,
    displayLabelTraces,
  })
}
