import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import {
  computeSchematicNetLabelCenter,
  getSchematicNetLabelTextWidth,
} from "lib/utils/schematic/computeSchematicNetLabelCenter"
import type { AxisDirection } from "./getSide"
import { oppositeSide } from "./oppositeSide"
import { Port } from "../../Port"
import type { NetLabel } from "../../NetLabel"
import { getNetNameFromPorts } from "./getNetNameFromPorts"
import Debug from "debug"
import type { SourceNet } from "circuit-json"
import {
  getPortIdsInsideExpandedTextBounds,
  snapPointToPinInsideExpandedBoundingBox,
} from "./snap-to-pins-inside-expanded-bounding-box"
import { doBoundsOverlap, type Bounds, type Point } from "@tscircuit/math-utils"

const debug = Debug("Group_doInitialSchematicTraceRender")

const NET_LABEL_TEXT_HEIGHT = 0.18
type SchematicPortId = string
type SchematicNetLabelId = string
type NetLabelText = string

// "Explicit" net labels are user-authored (placed directly via a <netlabel/> in
// the source), as opposed to labels the trace solver places automatically.
interface ExplicitNetLabel {
  schematic_net_label_id: SchematicNetLabelId
  text: NetLabelText
  source_net_id?: string | null
  center?: Point
  schematicPortIds: SchematicPortId[]
}

const getNetLabelTextBounds = ({
  center,
  text,
}: {
  center: Point
  text: NetLabelText
}): Bounds => {
  const width = getSchematicNetLabelTextWidth({ text })
  const halfWidth = width / 2
  const halfHeight = NET_LABEL_TEXT_HEIGHT / 2
  return {
    minX: center.x - halfWidth,
    maxX: center.x + halfWidth,
    minY: center.y - halfHeight,
    maxY: center.y + halfHeight,
  }
}

const isSameNet = (label: ExplicitNetLabel, sourceNet: SourceNet) =>
  label.source_net_id != null && label.source_net_id === sourceNet.source_net_id

// An explicit label is redundant with a solver placement when it labels the same
// net and either shares one of the placement's ports or visually overlaps it.
const isExplicitNetLabelRedundantWithPlacement = (
  label: ExplicitNetLabel,
  solverPlacement: {
    sourceNet: SourceNet
    text: NetLabelText
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
  const root = group.root!
  const { db } = root

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
  const explicitNetLabels: ExplicitNetLabel[] = (
    group.selectAll("netlabel") as NetLabel[]
  )
    .filter((label) => label.schematic_net_label_id)
    .map((label) => {
      const dbLabel = db.schematic_net_label.get(label.schematic_net_label_id!)
      return {
        schematic_net_label_id: label.schematic_net_label_id!,
        text: label._getNetName(),
        source_net_id: label.source_net_label_id,
        center: dbLabel?.center,
        schematicPortIds: label
          ._getConnectedPorts()
          .map((port) => port.schematic_port_id)
          .filter((id): id is string => Boolean(id)),
      }
    })

  for (const placement of dedupedNetLabelPlacements) {
    debug(`processing placement: ${placement.netId}`)

    const placementUserNetId = globalConnMap
      .getIdsConnectedToNet(placement.globalConnNetId)
      .find((id) => userNetIdToConnKey.get(id))
    const placementConnKey = userNetIdToConnKey.get(placementUserNetId!)

    let anchor_position = placement.anchorPoint

    const orientation = placement.orientation as AxisDirection
    const anchor_side = oppositeSide(orientation)

    let sourceNet: SourceNet | undefined
    if (placementConnKey) {
      sourceNet = connKeyToSourceNet.get(placementConnKey)
    }

    const schPortIds = placement.pinIds.map(
      (pinId) => pinIdToSchematicPortId.get(pinId)!,
    )

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

      const eligiblePortIds = getPortIdsInsideExpandedTextBounds(root)

      if (!hasRoutedTraceForPlacementPort) {
        anchor_position = snapPointToPinInsideExpandedBoundingBox(
          {
            point: anchor_position,
            schematicPortIds: schPortIds,
            eligiblePortIds,
          },
          root,
        )
      }

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
          explicitNetLabels.some((label) =>
            isExplicitNetLabelRedundantWithPlacement(label, solverPlacement),
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
        schematic_sheet_id: group._resolveSchematicSheetId(),
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
      schematic_sheet_id: group._resolveSchematicSheetId(),
    }
    db.schematic_net_label.insert(netLabel)
  }
}
