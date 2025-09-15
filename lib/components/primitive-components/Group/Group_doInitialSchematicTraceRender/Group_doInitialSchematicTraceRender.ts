import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import Debug from "debug"
import { createSchematicTraceSolverInputProblem } from "./createSchematicTraceSolverInputProblem"
import { applyTracesFromSolverOutput } from "./applyTracesFromSolverOutput"
import { applyNetLabelPlacements } from "./applyNetLabelPlacements"
import { insertNetLabelsForTracesExcludedFromRouting } from "./insertNetLabelsForTracesExcludedFromRouting"
import { insertNetLabelsForPortsMissingTrace } from "./insertNetLabelsForPortsMissingTrace"
import { getSchematicPortIdsWithAssignedNetLabels } from "./getSchematicPortIdsWithAssignedNetLabels"
import { getSchematicPortIdsWithRoutedTraces } from "./getSchematicPortIdsWithRoutedTraces"

const debug = Debug("Group_doInitialSchematicTraceRender")

/**
 * Render all traces within this subcircuit
 */
export const Group_doInitialSchematicTraceRender = (group: Group<any>) => {
  if (!group.root?._featureMspSchematicTraceRouting) return
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

  const schematicPortIdsWithPreExistingNetLabels =
    getSchematicPortIdsWithAssignedNetLabels(group)

  // Optional debug output
  if (debug.enabled) {
    group.root?.emit("debug:logOutput", {
      type: "debug:logOutput",
      name: "group-trace-render-input-problem",
      content: JSON.stringify(inputProblem, null, 2),
    })
  }

  // Solve routing
  const solver = new SchematicTracePipelineSolver(inputProblem)
  solver.solve()

  const schematicPortIdsWithRoutedTraces = getSchematicPortIdsWithRoutedTraces({
    solver,
    pinIdToSchematicPortId,
  })

  // Apply traces
  applyTracesFromSolverOutput({
    group,
    solver,
    pinIdToSchematicPortId,
    userNetIdToSck,
  })

  // Apply net labels (from solver placements and net-only ports)
  applyNetLabelPlacements({
    group,
    solver,
    sckToSourceNet,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    pinIdToSchematicPortId,
    allScks,
    userNetIdToSck,
    schematicPortIdsWithPreExistingNetLabels,
    schematicPortIdsWithRoutedTraces,
  })

  insertNetLabelsForPortsMissingTrace({
    group,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    sckToSourceNet,
    pinIdToSchematicPortId,
    schematicPortIdsWithPreExistingNetLabels,
  })

  // Insert labels for traces that explicitly asked for schDisplayLabel
  // insertNetLabelsForTracesExcludedFromRouting({
  //   group,
  //   solver,
  //   displayLabelTraces,
  //   pinIdToSchematicPortId,
  //   schematicPortIdsWithPreExistingNetLabels,
  // })
}
