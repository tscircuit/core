import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import { getSide, type AxisDirection } from "./getSide"
import { oppositeSide } from "./oppositeSide"

export function applyNetLabelPlacements(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  userNetIdToSck: Map<string, string>
  sckToSourceNet: Map<string, any>
  allSourceAndSchematicPortIdsInScope: Set<string>
  schPortIdToSourcePortId: Map<string, string>
  allScks: Set<string>
}) {
  const {
    group,
    solver,
    sckToSourceNet,
    allScks,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
    userNetIdToSck,
  } = args
  const { db } = group.root!

  // Place net labels suggested by the solver
  const netLabelPlacements =
    solver.netLabelPlacementSolver?.netLabelPlacements ?? []
  const globalConnMap = solver.mspConnectionPairSolver!.globalConnMap

  for (const placement of netLabelPlacements) {
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

    if (!sourceNet) {
      continue
    }

    const text = sourceNet.name
    const center =
      (placement as any).center ??
      computeSchematicNetLabelCenter({
        anchor_position,
        anchor_side: anchor_side as any,
        text,
      })

    db.schematic_net_label.insert({
      text,
      anchor_position,
      center,
      anchor_side: anchor_side as any,
      ...(sourceNet?.source_net_id
        ? { source_net_id: sourceNet.source_net_id }
        : {}),
    })
  }
}
