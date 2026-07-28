import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import Debug from "debug"
import type { PrimitiveComponent } from "../../../base-components/PrimitiveComponent"
import { NetLabel } from "../../NetLabel"
import { Group } from "../Group"
import { applyNetLabelPlacements } from "./applyNetLabelPlacements"
import { applyTracesFromSolverOutput } from "./applyTracesFromSolverOutput"
import { createSchematicTraceSolverInputProblem } from "./createSchematicTraceSolverInputProblem"
import {
  getSchematicPortIdsWithAssignedNetLabels,
  getSchematicPortIdsWithManuallyPositionedNetLabels,
} from "./getSchematicPortIdsWithAssignedNetLabels"
import { getSchematicPortIdsWithRoutedTraces } from "./getSchematicPortIdsWithRoutedTraces"
import { insertNetLabelsForPortsMissingTrace } from "./insertNetLabelsForPortsMissingTrace"

const debug = Debug("Group_doInitialSchematicTraceRender")

/**
 * Render traces within one schematic sheet of this subcircuit.
 */
const renderSchematicTracesForSheet = ({
  group,
  schematicSheetId,
  netLabels,
}: {
  group: Group<any>
  schematicSheetId?: string
  netLabels: NetLabel[]
}) => {
  const {
    inputProblem,
    connKeyToSourceNet,
    schematicPortIdsInScope,
    schematicPortIdsWithExternallyRoutedRepresentations,
    schPortIdToSourcePortId,
    userNetIdToConnKey,
    connKeysWithExplicitPortNetTraces,
    netLabelsInScope,
  } = createSchematicTraceSolverInputProblem(group, {
    schematicSheetId,
    netLabels,
  })

  if (inputProblem.chips.length === 0) return

  const schematicPortIdsWithExplicitNetLabels =
    getSchematicPortIdsWithAssignedNetLabels(netLabelsInScope)
  const schematicPortIdsWithManuallyPositionedNetLabels =
    getSchematicPortIdsWithManuallyPositionedNetLabels(netLabelsInScope)

  const hasRouteableSchematicConnections =
    inputProblem.directConnections.length > 0 ||
    inputProblem.netConnections.length > 0

  if (!hasRouteableSchematicConnections) {
    insertNetLabelsForPortsMissingTrace({
      group,
      schematicPortIdsInScope,
      schematicPortIdsWithExternallyRoutedRepresentations,
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
  })

  // Apply traces
  applyTracesFromSolverOutput({
    group,
    solver,
    userNetIdToConnKey,
    schematicPortIdsWithExplicitNetLabels,
    schematicPortIdsWithManuallyPositionedNetLabels,
  })

  // Apply net labels (from solver placements and net-only ports)
  applyNetLabelPlacements({
    group,
    solver,
    connKeyToSourceNet,
    userNetIdToConnKey,
    connKeysWithExplicitPortNetTraces,
    schematicPortIdsWithManuallyPositionedNetLabels,
    schematicPortIdsWithRoutedTraces,
    netLabels: netLabelsInScope,
  })

  insertNetLabelsForPortsMissingTrace({
    group,
    schematicPortIdsInScope,
    schematicPortIdsWithExternallyRoutedRepresentations,
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

  // A net label that targets this group can be declared in the group itself or
  // in any enclosing schematic scope (as in a board-level label targeting a
  // port inside a subcircuit). Collect those scopes once for all sheet passes.
  // selectAll intentionally stops at child subcircuit boundaries, so walking
  // upward includes ancestor-owned labels without pulling in sibling labels.
  const netLabels = new Set<NetLabel>()
  const board = group._getBoard()
  let schematicScope: PrimitiveComponent | null = group
  while (schematicScope) {
    if (schematicScope instanceof Group) {
      for (const netLabel of schematicScope.selectAll<NetLabel>("netlabel")) {
        netLabels.add(netLabel)
      }
    }
    if (schematicScope === board) break
    schematicScope = schematicScope.parent
  }
  const netLabelComponents = [...netLabels]

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
    renderSchematicTracesForSheet({ group, netLabels: netLabelComponents })
    return
  }

  for (const schematicSheetId of schematicSheetIds) {
    renderSchematicTracesForSheet({
      group,
      schematicSheetId,
      netLabels: netLabelComponents,
    })
  }
}
