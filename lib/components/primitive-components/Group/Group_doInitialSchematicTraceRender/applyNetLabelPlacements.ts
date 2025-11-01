import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import { getSide, type AxisDirection } from "./getSide"
import { oppositeSide } from "./oppositeSide"
import { Port } from "../../Port"
import { getNetNameFromPorts } from "./getNetNameFromPorts"
import Debug from "debug"

const debug = Debug("Group_doInitialSchematicTraceRender")

export function applyNetLabelPlacements(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  userNetIdToSck: Map<string, string>
  sckToSourceNet: Map<string, any>
  allSourceAndSchematicPortIdsInScope: Set<string>
  schPortIdToSourcePortId: Map<string, string>
  allScks: Set<string>
  pinIdToSchematicPortId: Map<string, string>
  schematicPortIdsWithPreExistingNetLabels: Set<string>
  schematicPortIdsWithRoutedTraces: Set<string>
}) {
  const {
    group,
    solver,
    sckToSourceNet,
    allScks,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    userNetIdToSck,
    pinIdToSchematicPortId,
    schematicPortIdsWithPreExistingNetLabels,
    schematicPortIdsWithRoutedTraces,
  } = args
  const { db } = group.root!

  // Place net labels suggested by the solver
  const netLabelPlacements =
    solver.netLabelPlacementSolver?.netLabelPlacements ??
    solver.traceLabelOverlapAvoidanceSolver?.getOutput().netLabelPlacements ??
    []
  const globalConnMap = solver.mspConnectionPairSolver!.globalConnMap

  for (const placement of netLabelPlacements) {
    debug(`processing placement: ${placement.netId}`)

    const placementUserNetId = globalConnMap
      .getIdsConnectedToNet(placement.globalConnNetId)
      .find((id) => userNetIdToSck.get(id))
    const placementSck = userNetIdToSck.get(placementUserNetId!)

    const anchor_position = placement.anchorPoint

    const orientation = placement.orientation as AxisDirection
    const anchor_side = oppositeSide(orientation)

    const sourceNet = placementSck
      ? sckToSourceNet.get(placementSck)
      : undefined

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
      const text = sourceNet.name

      const center = computeSchematicNetLabelCenter({
        anchor_position,
        anchor_side: anchor_side as any,
        text,
      })

      // @ts-ignore
      db.schematic_net_label.insert({
        text,
        anchor_position,
        center,
        anchor_side: anchor_side as any,
        ...(sourceNet?.source_net_id
          ? { source_net_id: sourceNet.source_net_id }
          : {}),
      })
      continue
    }

    const ports = group
      .selectAll<Port>("port")
      .filter((p) => p._getSubcircuitConnectivityKey() === placementSck)

    const { name: text, wasAssignedDisplayLabel } = getNetNameFromPorts(ports)

    if (
      !wasAssignedDisplayLabel &&
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
      anchor_side: anchor_side as any,
      text,
    })

    // @ts-ignore
    db.schematic_net_label.insert({
      text,
      anchor_position,
      center,
      anchor_side: anchor_side as any,
    })
  }
}
