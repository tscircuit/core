import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import Debug from "debug"
import { createSchematicTraceSolverInputProblem } from "./createSchematicTraceSolverInputProblem"
import { applyTracesFromSolverOutput } from "./applyTracesFromSolverOutput"
import { applyNetLabelPlacements } from "./applyNetLabelPlacements"
import { insertNetLabelsForPortsMissingTrace } from "./insertNetLabelsForPortsMissingTrace"
import { getSchematicPortIdsWithAssignedNetLabels } from "./getSchematicPortIdsWithAssignedNetLabels"
import { getSchematicPortIdsWithRoutedTraces } from "./getSchematicPortIdsWithRoutedTraces"

const debug = Debug("Group_doInitialSchematicTraceRender")

/**
 * Render traces within one schematic sheet of this subcircuit.
 */
const renderSchematicTracesForSheet = ({
  group,
  schematicSheetId,
}: {
  group: Group<any>
  schematicSheetId?: string
}) => {
  const {
    inputProblem,
    pinIdToSchematicPortId,
    connKeyToSourceNet,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    userNetIdToConnKey,
    connKeysWithExplicitPortNetTraces,
  } = createSchematicTraceSolverInputProblem(group, { schematicSheetId })

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

/**
 * Render all traces within this subcircuit. Each schematic sheet is solved
 * independently because their component coordinates occupy separate drawing
 * spaces and may overlap numerically.
 */
export const Group_doInitialSchematicTraceRender = (group: Group<any>) => {
  if (!group.root?._featureMspSchematicTraceRouting) return
  if (!group.isSubcircuit) return
  if (group.root?.schematicDisabled) return

  const schematicGroupIds = new Set(
    [
      group,
      ...group
        .getDescendants()
        .filter(
          (component): component is Group<any> => component instanceof Group,
        ),
    ]
      .map((schematicGroup) => schematicGroup.schematic_group_id)
      .filter((schematicGroupId): schematicGroupId is string =>
        Boolean(schematicGroupId),
      ),
  )
  const schematicSheetIds = new Set(
    group.root.db.schematic_component
      .list()
      .filter((schematicComponent) =>
        schematicGroupIds.has(schematicComponent.schematic_group_id!),
      )
      .map((schematicComponent) => schematicComponent.schematic_sheet_id)
      .filter((schematicSheetId): schematicSheetId is string =>
        Boolean(schematicSheetId),
      ),
  )

  if (schematicSheetIds.size === 0) {
    renderSchematicTracesForSheet({ group })
    return
  }

  for (const schematicSheetId of schematicSheetIds) {
    renderSchematicTracesForSheet({ group, schematicSheetId })
  }
}
