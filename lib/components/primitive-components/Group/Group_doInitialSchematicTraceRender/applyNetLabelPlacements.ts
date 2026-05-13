import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import type { AxisDirection } from "./getSide"
import { oppositeSide } from "./oppositeSide"
import { Port } from "../../Port"
import { getNetNameFromPorts } from "./getNetNameFromPorts"
import Debug from "debug"
import type { SourceNet } from "circuit-json"

const debug = Debug("Group_doInitialSchematicTraceRender")

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
    solver.netLabelTraceCollisionSolver?.getOutput().netLabelPlacements ??
    solver.netLabelPlacementSolver?.netLabelPlacements ??
    solver.traceLabelOverlapAvoidanceSolver?.getOutput().netLabelPlacements ??
    []
  const netLabelPlacementCountByGlobalNetId = new Map<string, number>()
  for (const placement of netLabelPlacements) {
    netLabelPlacementCountByGlobalNetId.set(
      placement.globalConnNetId,
      (netLabelPlacementCountByGlobalNetId.get(placement.globalConnNetId) ??
        0) + 1,
    )
  }
  const globalConnMap = solver.mspConnectionPairSolver!.globalConnMap

  for (const placement of netLabelPlacements) {
    debug(`processing placement: ${placement.netId}`)

    const placementUserNetId = globalConnMap
      .getIdsConnectedToNet(placement.globalConnNetId)
      .find((id) => userNetIdToConnKey.get(id))
    const placementConnKey = userNetIdToConnKey.get(placementUserNetId!)

    const anchor_position = placement.anchorPoint

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

      const center = computeSchematicNetLabelCenter({
        anchor_position,
        anchor_side,
        text,
      })

      const netLabel: Parameters<typeof db.schematic_net_label.insert>[0] = {
        text,
        source_net_id: sourceNet.source_net_id,
        anchor_position,
        center,
        anchor_side,
      }
      db.schematic_net_label.insert(netLabel)
      continue
    }

    const ports = group
      .selectAll<Port>("port")
      .filter((p) => p._getSubcircuitConnectivityKey() === placementConnKey)

    const { name: text, wasAssignedDisplayLabel } = getNetNameFromPorts(ports)

    if (
      !wasAssignedDisplayLabel &&
      (netLabelPlacementCountByGlobalNetId.get(placement.globalConnNetId) ??
        0) <= 1 &&
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
    }
    db.schematic_net_label.insert(netLabel)
  }
}
