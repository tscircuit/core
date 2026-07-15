import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import Debug from "debug"
import { Group } from "../Group"
import { applyNetLabelPlacements } from "./applyNetLabelPlacements"
import { applyTracesFromSolverOutput } from "./applyTracesFromSolverOutput"
import { createSchematicTraceSolverInputProblem } from "./createSchematicTraceSolverInputProblem"
import { getSchematicPortIdsWithAssignedNetLabels } from "./getSchematicPortIdsWithAssignedNetLabels"
import { getSchematicPortIdsWithRoutedTraces } from "./getSchematicPortIdsWithRoutedTraces"
import { insertNetLabelsForPortsMissingTrace } from "./insertNetLabelsForPortsMissingTrace"

const debug = Debug("Group_doInitialSchematicTraceRender")

/**
 * Render all traces within this subcircuit
 */
export const Group_doInitialSchematicTraceRender = (group: Group<any>) => {
  if (!group.root?._featureMspSchematicTraceRouting) return
  if (!group.isSubcircuit) return
  if (group.root?.schematicDisabled) return
  if (group._isInflatedFromCircuitJson && !group._hasImportedSchematicElements)
    return

  // Prepare the solver input and context
  const {
    inputProblem,
    pinIdToSchematicPortId,
    connKeyToSourceNet,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    userNetIdToConnKey,
    connKeysWithExplicitPortNetTraces,
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
      connKeyToSourceNet,
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
  group.root?.emit("solver:started", {
    type: "solver:started",
    solverName: "SchematicTracePipelineSolver",
    // getConstructorParams() now returns the full constructor tuple
    // [inputProblem, opts?]; the event exposes the input problem itself.
    solverParams: solver.getConstructorParams()[0],
    componentName: group.getString(),
  })
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
    userNetIdToConnKey,
    schematicPortIdsWithPreExistingNetLabels,
  })

  // Apply net labels (from solver placements and net-only ports)
  applyNetLabelPlacements({
    group,
    solver,
    connKeyToSourceNet,
    pinIdToSchematicPortId,
    userNetIdToConnKey,
    connKeysWithExplicitPortNetTraces,
    schematicPortIdsWithPreExistingNetLabels,
    schematicPortIdsWithRoutedTraces,
  })

  insertNetLabelsForPortsMissingTrace({
    group,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    connKeyToSourceNet,
  })
}
