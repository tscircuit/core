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
    scksWithExplicitPortNetTraces,
  } = createSchematicTraceSolverInputProblem(group)

  if (inputProblem.chips.length === 0) return

  const schematicPortIdsWithPreExistingNetLabels =
    getSchematicPortIdsWithAssignedNetLabels(group)

  const hasRouteableSchematicConnections =
    inputProblem.directConnections.length > 0 ||
    inputProblem.netConnections.length > 0

  if (!hasRouteableSchematicConnections) {
    insertNetLabelsForPortsMissingTrace({
      group,
      allSourceAndSchematicPortIdsInScope,
      schPortIdToSourcePortId,
      sckToSourceNet,
    })
    return
  }

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
    schematicPortIdsWithPreExistingNetLabels,
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
    scksWithExplicitPortNetTraces,
    schematicPortIdsWithPreExistingNetLabels,
    schematicPortIdsWithRoutedTraces,
  })

  insertNetLabelsForPortsMissingTrace({
    group,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    sckToSourceNet,
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
