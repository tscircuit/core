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
  sourceTraceIdByPinPairKey: Map<string, string>
}) {
  const { group, solver, userNetIdToConnKey, sourceTraceIdByPinPairKey } = args
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

    let sourceTraceId = sourceTraceIdByPinPairKey.get(
      [...schematicPortIds].sort().join("::"),
    )
    if (!sourceTraceId && connKey) {
      const sourcePortIds = schematicPortIds.flatMap((schematicPortId) => {
        const sourcePortId =
          db.schematic_port.get(schematicPortId)?.source_port_id
        return sourcePortId ? [sourcePortId] : []
      })
      sourceTraceId = db.source_trace
        .list()
        .find(
          (sourceTrace) =>
            sourceTrace.subcircuit_connectivity_map_key === connKey &&
            sourcePortIds.some((sourcePortId) =>
              sourceTrace.connected_source_port_ids.includes(sourcePortId),
            ),
        )?.source_trace_id
    }

    // Inline labels belong to the same sheet as the trace they annotate.
    let schematicSheetId = group._resolveSchematicSheetId()
    const schematicPort = db.schematic_port.get(schematicPortIds[0]!)
    if (schematicPort?.schematic_sheet_id) {
      schematicSheetId = schematicPort.schematic_sheet_id
    }

    // Keep the text against its trace. The solver reserves a small collision
    // margin, but rendering that margin makes labels between dense traces look
    // like they belong to the neighboring wire.
    let placementOffset = { x: 0, y: 0 }
    let stubTracePath = placement.stubTracePath?.map((point) => ({ ...point }))
    if (stubTracePath && schematicPortIds.length === 1) {
      const portCenter = db.schematic_port.get(schematicPortIds[0]!)?.center
      if (portCenter) {
        placementOffset = {
          x: portCenter.x - stubTracePath[0]!.x,
          y: portCenter.y - stubTracePath[0]!.y,
        }
        stubTracePath = stubTracePath.map((point) => ({
          x: point.x + placementOffset.x,
          y: point.y + placementOffset.y,
        }))
      }
    }

    const shiftedAnchorPoint = {
      x: placement.anchorPoint.x + placementOffset.x,
      y: placement.anchorPoint.y + placementOffset.y,
    }
    const position = {
      x: placement.center.x + placementOffset.x,
      y: placement.center.y + placementOffset.y,
    }
    let textAnchor: "center" | "left" | "right" = "center"
    const halfHeight = placement.height / 2
    switch (placement.side) {
      case "y+":
        position.y = shiftedAnchorPoint.y + halfHeight
        break
      case "y-":
        position.y = shiftedAnchorPoint.y - halfHeight
        break
      case "x+":
        position.x = shiftedAnchorPoint.x + halfHeight
        break
      case "x-":
        position.x = shiftedAnchorPoint.x - halfHeight
        break
    }

    if (stubTracePath && stubTracePath.length === 2) {
      const [start, end] = stubTracePath
      if (placement.axis === "x") {
        const extendsRight = end.x > start.x
        textAnchor = extendsRight ? "left" : "right"
        position.x += extendsRight ? -placement.width / 2 : placement.width / 2
      } else {
        const extendsUp = end.y > start.y
        textAnchor = extendsUp ? "left" : "right"
        position.y += extendsUp ? -placement.width / 2 : placement.width / 2
      }
    }

    if (stubTracePath && stubTracePath.length === 2) {
      db.schematic_trace.insert({
        source_trace_id: sourceTraceId,
        edges: [{ from: stubTracePath[0]!, to: stubTracePath[1]! }],
        junctions: [],
        subcircuit_connectivity_map_key: connKey,
        schematic_sheet_id: schematicSheetId,
      })
      db.schematic_port.update(schematicPortIds[0]!, {
        is_connected: true,
      })
    }

    db.schematic_text.insert({
      text,
      // Links the label back to the trace it names, so a consumer can tell an
      // inline net label apart from free-standing schematic text.
      source_trace_id: sourceTraceId,
      // A terminal label grows outward from the pin: labels leaving the right
      // side start at their inner edge, while labels leaving the left side end
      // there. Point-to-point inline labels remain centered.
      anchor: textAnchor,
      position,
      rotation: placement.axis === "y" ? VERTICAL_INLINE_NET_LABEL_ROTATION : 0,
      font_size: placement.height,
      color: INLINE_NET_LABEL_COLOR,
      schematic_sheet_id: schematicSheetId,
    })
  }
}
