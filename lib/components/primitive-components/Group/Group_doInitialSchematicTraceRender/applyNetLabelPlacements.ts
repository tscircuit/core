import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import type { AxisDirection } from "./getSide"
import { oppositeSide } from "./oppositeSide"
import { Port } from "../../Port"
import type { NetLabel } from "../../NetLabel"
import { getNetNameFromPorts } from "./getNetNameFromPorts"
import { getNetLabelTextBounds } from "./getNetLabelTextBounds"
import Debug from "debug"
import type { SchematicNetLabel, SourceNet } from "circuit-json"
import { doBoundsOverlap, type Bounds } from "@tscircuit/math-utils"

const debug = Debug("Group_doInitialSchematicTraceRender")

type SchematicPortId = string

// User-defined net labels are placed directly via a <netlabel/> in the source,
// as opposed to labels the trace solver places automatically.
interface UserDefinedNetLabel extends SchematicNetLabel {
  schematicPortIds: SchematicPortId[]
}

const isSameNet = (label: UserDefinedNetLabel, sourceNet: SourceNet) =>
  label.source_net_id != null && label.source_net_id === sourceNet.source_net_id

// A user-defined label is redundant with a solver placement when it labels the
// same net and either shares one of the placement's ports or visually overlaps it.
const isUserDefinedNetLabelRedundantWithPlacement = (
  label: UserDefinedNetLabel,
  solverPlacement: {
    sourceNet: SourceNet
    text: string
    schematicPortIds: Set<SchematicPortId>
    bounds: Bounds
  },
) => {
  if (!isSameNet(label, solverPlacement.sourceNet)) {
    return false
  }
  if (
    label.schematicPortIds.some((id) =>
      solverPlacement.schematicPortIds.has(id),
    )
  ) {
    return true
  }
  if (!label.center) return false
  return doBoundsOverlap(
    getNetLabelTextBounds({ center: label.center, text: label.text }),
    solverPlacement.bounds,
  )
}

export function applyNetLabelPlacements(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  userNetIdToConnKey: Map<string, string>
  connKeyToSourceNet: Map<string, SourceNet>
  pinIdToSchematicPortId: Map<string, string>
  connKeysWithExplicitPortNetTraces: Set<string>
  schematicPortIdsWithPreExistingNetLabels: Set<string>
  schematicPortIdsWithRoutedTraces: Set<string>
}) {
  const {
    group,
    solver,
    connKeyToSourceNet,
    userNetIdToConnKey,
    pinIdToSchematicPortId,
    connKeysWithExplicitPortNetTraces,
    schematicPortIdsWithPreExistingNetLabels,
    schematicPortIdsWithRoutedTraces,
  } = args
  const { db } = group.root!

  // Place net labels suggested by the solver
  const netLabelPlacements =
    solver.netLabelNetLabelCollisionSolver?.getOutput().netLabelPlacements ??
    solver.netLabelTraceCollisionSolver?.getOutput().netLabelPlacements ??
    solver.netLabelPlacementSolver?.netLabelPlacements ??
    solver.traceLabelOverlapAvoidanceSolver?.getOutput().netLabelPlacements ??
    []
  const dedupedNetLabelPlacements: typeof netLabelPlacements = []
  const netLabelPlacementKeys = new Set<string>()
  for (const placement of netLabelPlacements) {
    const pinIds = [...(placement.pinIds ?? [])].sort()
    const key = `${placement.globalConnNetId}|${pinIds.join("::")}|${placement.netId ?? ""}`
    if (netLabelPlacementKeys.has(key)) {
      debug(
        `skipping duplicate placement for "${placement.netId}" REASON:identical net label placement`,
      )
      continue
    }
    netLabelPlacementKeys.add(key)
    dedupedNetLabelPlacements.push(placement)
  }

  const netLabelPlacementCountByGlobalNetId = new Map<string, number>()
  const routedPairKeysByGlobalNetId = new Map<string, Set<string>>()
  const globalNetIdsWithPortOnlyPlacements = new Set<string>()
  for (const placement of dedupedNetLabelPlacements) {
    netLabelPlacementCountByGlobalNetId.set(
      placement.globalConnNetId,
      (netLabelPlacementCountByGlobalNetId.get(placement.globalConnNetId) ??
        0) + 1,
    )
    if ((placement.pinIds?.length ?? 0) > 1) {
      if (!routedPairKeysByGlobalNetId.has(placement.globalConnNetId)) {
        routedPairKeysByGlobalNetId.set(placement.globalConnNetId, new Set())
      }
      routedPairKeysByGlobalNetId
        .get(placement.globalConnNetId)!
        .add(placement.pinIds.slice().sort().join("::"))
    }
    if ((placement.pinIds?.length ?? 0) <= 1) {
      globalNetIdsWithPortOnlyPlacements.add(placement.globalConnNetId)
    }
  }
  const globalConnMap = solver.mspConnectionPairSolver!.globalConnMap
  const userDefinedNetLabels: UserDefinedNetLabel[] = (
    group.selectAll("netlabel") as NetLabel[]
  )
    .map((label) => {
      if (!label.schematic_net_label_id) return null
      const dbLabel = db.schematic_net_label.get(label.schematic_net_label_id)
      if (!dbLabel) return null
      return {
        ...dbLabel,
        schematicPortIds: label
          ._getConnectedPorts()
          .map((port) => port.schematic_port_id)
          .filter((id): id is string => Boolean(id)),
      }
    })
    .filter((label): label is UserDefinedNetLabel => label !== null)

  for (const placement of dedupedNetLabelPlacements) {
    debug(`processing placement: ${placement.netId}`)

    const placementUserNetId = globalConnMap
      .getIdsConnectedToNet(placement.globalConnNetId)
      .find((id) => userNetIdToConnKey.get(id))
    const placementConnKey = userNetIdToConnKey.get(placementUserNetId!)

    const orientation = placement.orientation as AxisDirection
    const anchor_side = oppositeSide(orientation)

    let sourceNet: SourceNet | undefined
    if (placementConnKey) {
      sourceNet = connKeyToSourceNet.get(placementConnKey)
    }

    const schPortIds = placement.pinIds.map(
      (pinId) => pinIdToSchematicPortId.get(pinId)!,
    )
    // Solver labels belong to the same sheet as their connected port.
    let schematicSheetId = group._resolveSchematicSheetId()
    const schematicPort = db.schematic_port.get(schPortIds[0])
    if (schematicPort?.schematic_sheet_id) {
      schematicSheetId = schematicPort.schematic_sheet_id
    }

    // createSchematicTraceSolverInputProblem hands the solver each pin at its
    // real schematic_port.center, but also a chip box expanded to fit the
    // component's text (getSchematicComponentWithTextBounds). That box can extend
    // past the pin, so the solver anchors the pin's net label at the box edge -
    // slightly off the pin. When the pin's connection is already drawn (a routed
    // trace / power symbol), that gap is bridged and fine. When it isn't, the
    // label floats AND insertNetLabelsForPortsMissingTrace adds a second,
    // pin-anchored label for the same port (a duplicate). Snap the anchor back
    // onto the pin - the same correction applyTracesFromSolverOutput already does
    // for trace endpoints - so the label connects and lands exactly where that
    // pass anchors, letting its position-based dedupe drop the duplicate. Guarded
    // on !is_connected (the same signal that pass uses) so already-drawn
    // connections keep the solver's intentional edge placement.
    let anchor_position = placement.anchorPoint
    if (schPortIds.length === 1 && schPortIds[0]) {
      const anchorSchPort = db.schematic_port.get(schPortIds[0])
      if (anchorSchPort?.center && !anchorSchPort.is_connected) {
        anchor_position = anchorSchPort.center
      }
    }

    if (
      schPortIds.some((schPortId) =>
        schematicPortIdsWithPreExistingNetLabels.has(schPortId),
      )
    ) {
      debug(
        `skipping net label placement for "${placement.netId!}" REASON:schematic port has pre-existing net label`,
      )
      continue
    }

    if (sourceNet) {
      const isPowerOrGroundNet = sourceNet.is_ground || sourceNet.is_power
      const hasExplicitPortNetTrace = connKeysWithExplicitPortNetTraces.has(
        placementConnKey!,
      )
      const hasRoutedTraceForPlacementPort = schPortIds.some((id) =>
        schematicPortIdsWithRoutedTraces.has(id),
      )
      const hasSingleLabelPlacement =
        (netLabelPlacementCountByGlobalNetId.get(placement.globalConnNetId) ??
          0) <= 1
      const shouldSkipImplicitSignalNetLabel =
        !hasExplicitPortNetTrace &&
        !isPowerOrGroundNet &&
        hasRoutedTraceForPlacementPort &&
        hasSingleLabelPlacement

      if (shouldSkipImplicitSignalNetLabel) {
        debug(
          `skipping net label placement for "${placement.netId!}" REASON:schematic port has routed trace`,
        )
        continue
      }

      const text = sourceNet.name

      const center = computeSchematicNetLabelCenter({
        anchor_position,
        anchor_side,
        text,
      })

      if (!isPowerOrGroundNet) {
        const solverPlacement = {
          sourceNet,
          text,
          schematicPortIds: new Set(schPortIds),
          bounds: getNetLabelTextBounds({ center, text }),
        }
        if (
          userDefinedNetLabels.some((label) =>
            isUserDefinedNetLabelRedundantWithPlacement(label, solverPlacement),
          )
        ) {
          continue
        }
      }

      const netLabel: Parameters<typeof db.schematic_net_label.insert>[0] = {
        text,
        source_net_id: sourceNet.source_net_id,
        anchor_position,
        center,
        anchor_side,
        schematic_sheet_id: schematicSheetId,
      }
      db.schematic_net_label.insert(netLabel)
      continue
    }

    const ports = group
      .selectAll<Port>("port")
      .filter((p) => p._getSubcircuitConnectivityKey() === placementConnKey)

    const { name: text, wasAssignedDisplayLabel } = getNetNameFromPorts(ports)
    const isRoutedPairPlacement = (placement.pinIds?.length ?? 0) > 1
    const shouldKeepRoutedPairLabel =
      isRoutedPairPlacement &&
      (globalNetIdsWithPortOnlyPlacements.has(placement.globalConnNetId) ||
        (routedPairKeysByGlobalNetId.get(placement.globalConnNetId)?.size ??
          0) > 1)

    if (
      !wasAssignedDisplayLabel &&
      !shouldKeepRoutedPairLabel &&
      schPortIds.some((schPortId) =>
        schematicPortIdsWithRoutedTraces.has(schPortId),
      )
    ) {
      debug(
        `skipping net label placement for "${placement.netId!}" REASON:schematic port has routed traces and no display label`,
      )
      continue
    }

    const center = computeSchematicNetLabelCenter({
      anchor_position,
      anchor_side,
      text,
    })

    const netLabel: Parameters<typeof db.schematic_net_label.insert>[0] = {
      text,
      source_net_id:
        placementConnKey ?? placement.netId ?? placement.globalConnNetId,
      anchor_position,
      center,
      anchor_side,
      schematic_sheet_id: schematicSheetId,
    }
    db.schematic_net_label.insert(netLabel)
  }
}
