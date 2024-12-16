import type { SoupUtilObjects } from "@tscircuit/soup-util"
import type { Port } from "../Port"

interface CreateDownwardNetLabelSymbolParams {
  fromPort: Port
  toPort: Port
  fromAnchorPos: { x: number; y: number }
  toAnchorPos: { x: number; y: number }
  schDisplayLabel: string
  source_trace_id: string
}

const calculateOffsets = (port: Port) => {
  const schBoxOffset = {
    left: { x: -0.5, y: 0 },
    up: { x: 0.5, y: 0.5 },
    right: { x: 0.5, y: 0 },
    down: { x: 0, y: -0.5 },
  }[port.facingDirection!]

  const schBoxVertOffset = port.parent?.config.shouldRenderAsSchematicBox
    ? 3
    : 1
  const schBoxHorzOffset =
    port.parent?.config.shouldRenderAsSchematicBox &&
    (port.facingDirection === "left" || port.facingDirection === "right")
      ? 3
      : 1

  const horzPortDirection = schBoxOffset.x
  const vertPortDirectionOffset = schBoxOffset.y
  const handleUp = port.facingDirection === "up" ? 0.5 : 0

  return {
    schBoxVertOffset,
    schBoxHorzOffset,
    horzPortDirection,
    vertPortDirectionOffset,
    handleUp,
  }
}

export const createDownwardNetLabelGroundSymbol = (
  {
    fromPort,
    toPort,
    fromAnchorPos,
    toAnchorPos,
    schDisplayLabel,
    source_trace_id,
  }: CreateDownwardNetLabelSymbolParams,
  { db }: { db: SoupUtilObjects },
): void => {
  const fromOffsets = calculateOffsets(fromPort)
  db.schematic_net_label.insert({
    anchor_side: "top",
    center: {
      x:
        fromAnchorPos.x +
        fromOffsets.horzPortDirection * fromOffsets.schBoxHorzOffset,
      y:
        fromAnchorPos.y +
        fromOffsets.vertPortDirectionOffset * fromOffsets.schBoxVertOffset,
    },
    source_net_id: fromPort.source_port_id!,
    text: schDisplayLabel!,
    anchor_position: {
      x:
        fromAnchorPos.x +
        fromOffsets.horzPortDirection * fromOffsets.schBoxHorzOffset,
      y:
        fromAnchorPos.y +
        fromOffsets.vertPortDirectionOffset * fromOffsets.schBoxVertOffset,
    },
    symbol_name: "ground_horz",
  })

  db.schematic_trace.insert({
    edges: [
      {
        from: { x: fromAnchorPos.x, y: fromAnchorPos.y },
        to: {
          x: fromAnchorPos.x,
          y:
            fromAnchorPos.y +
            fromOffsets.handleUp * fromOffsets.schBoxVertOffset,
        },
      },
      {
        from: { x: fromAnchorPos.x, y: fromAnchorPos.y },
        to: {
          x:
            fromAnchorPos.x +
            fromOffsets.horzPortDirection * fromOffsets.schBoxHorzOffset,
          y:
            fromAnchorPos.y +
            fromOffsets.vertPortDirectionOffset * fromOffsets.schBoxVertOffset,
        },
      },
    ],
    junctions: [
      {
        x:
          fromAnchorPos.x +
          fromOffsets.horzPortDirection * fromOffsets.schBoxHorzOffset,
        y:
          fromAnchorPos.y +
          fromOffsets.vertPortDirectionOffset * fromOffsets.schBoxVertOffset,
      },
    ],
    source_trace_id: source_trace_id!,
  })

  const toOffsets = calculateOffsets(toPort)
  db.schematic_net_label.insert({
    anchor_side: "top",
    center: {
      x:
        toAnchorPos.x +
        toOffsets.horzPortDirection * toOffsets.schBoxHorzOffset,
      y:
        toAnchorPos.y +
        toOffsets.vertPortDirectionOffset * toOffsets.schBoxVertOffset,
    },
    source_net_id: toPort.source_port_id!,
    text: schDisplayLabel!,
    anchor_position: {
      x:
        toAnchorPos.x +
        toOffsets.horzPortDirection * toOffsets.schBoxHorzOffset,
      y:
        toAnchorPos.y +
        toOffsets.vertPortDirectionOffset * toOffsets.schBoxVertOffset,
    },
    symbol_name: "ground_horz",
  })

  const toHandleUp = toPort.facingDirection === "up" ? 0.5 : 0
  db.schematic_trace.insert({
    edges: [
      {
        from: { x: toAnchorPos.x, y: toAnchorPos.y },
        to: {
          x: toAnchorPos.x,
          y: toAnchorPos.y + toHandleUp * toOffsets.schBoxVertOffset,
        },
      },
      {
        from: { x: toAnchorPos.x, y: toAnchorPos.y },
        to: {
          x:
            toAnchorPos.x +
            toOffsets.horzPortDirection * toOffsets.schBoxHorzOffset,
          y:
            toAnchorPos.y +
            toOffsets.vertPortDirectionOffset * toOffsets.schBoxVertOffset,
        },
      },
    ],
    junctions: [
      {
        x:
          toAnchorPos.x +
          toOffsets.horzPortDirection * toOffsets.schBoxHorzOffset,
        y:
          toAnchorPos.y +
          toOffsets.vertPortDirectionOffset * toOffsets.schBoxVertOffset,
      },
    ],
    source_trace_id: source_trace_id!,
  })
}
