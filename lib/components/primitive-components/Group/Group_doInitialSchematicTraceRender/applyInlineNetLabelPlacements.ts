import type { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import Debug from "debug"
import { Group } from "../Group"
import { createCanonicalSchematicNetLabelTextResolver } from "./createCanonicalSchematicNetLabelTextResolver"
import { asSchematicPortId } from "./port-id-types"

const debug = Debug("Group_doInitialSchematicTraceRender")

/**
 * Matches the net label text color so an inline label reads as the same kind of
 * annotation as an anchored one.
 */
const INLINE_NET_LABEL_COLOR = "rgb(132, 0, 0)"

/**
 * Text drawn along a vertical wire reads bottom-to-top, which is a
 * counter-clockwise quarter turn. SVG rotations are clockwise-positive.
 */
const VERTICAL_INLINE_NET_LABEL_ROTATION = -90

/**
 * Emits the solver's inline net labels - net names drawn parallel to the trace
 * they belong to - as `schematic_text`.
 *
 * These are rotated, so they cannot be a `schematic_net_label` (that element is
 * always axis-aligned with an anchor side and a tag symbol). The anchored
 * placement for the same net has already been dropped by the solver, so this
 * never doubles up with `applyNetLabelPlacements`.
 */
export function applyInlineNetLabelPlacements(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  userNetIdToConnKey: Map<string, string>
}) {
  const { group, solver, userNetIdToConnKey } = args
  const { db } = group.root!

  const inlineNetLabelPlacements =
    solver.inlineNetLabelSolver?.getOutput().inlineNetLabelPlacements ?? []
  if (inlineNetLabelPlacements.length === 0) return

  const resolveCanonicalNetLabelText =
    createCanonicalSchematicNetLabelTextResolver(group)
  const globalConnMap = solver.mspConnectionPairSolver!.globalConnMap

  for (const placement of inlineNetLabelPlacements) {
    const schematicPortIds = placement.pinIds.map(asSchematicPortId)

    const placementUserNetId = globalConnMap
      .getIdsConnectedToNet(placement.globalConnNetId)
      .find((id: string) => userNetIdToConnKey.has(id))
    const connKey = placementUserNetId
      ? userNetIdToConnKey.get(placementUserNetId)
      : undefined

    const text = connKey
      ? resolveCanonicalNetLabelText({ subcircuitConnectivityMapKey: connKey })
          .name
      : (placement.netId ?? placement.globalConnNetId)
    if (!text) {
      debug(
        `skipping inline net label for "${placement.netId}" REASON:no resolvable text`,
      )
      continue
    }

    // Inline labels belong to the same sheet as the trace they annotate.
    let schematicSheetId = group._resolveSchematicSheetId()
    const schematicPort = db.schematic_port.get(schematicPortIds[0]!)
    if (schematicPort?.schematic_sheet_id) {
      schematicSheetId = schematicPort.schematic_sheet_id
    }

    db.schematic_text.insert({
      text,
      anchor: "center",
      position: placement.center,
      rotation: placement.axis === "y" ? VERTICAL_INLINE_NET_LABEL_ROTATION : 0,
      font_size: placement.height,
      color: INLINE_NET_LABEL_COLOR,
      schematic_sheet_id: schematicSheetId,
    })
  }
}
