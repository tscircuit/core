import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { Port } from "../Port"

interface CreateDownwardNetLabelSymbolParams {
  port: Port
  anchorPos: { x: number; y: number }
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
    port,
    anchorPos,
    schDisplayLabel,
    source_trace_id,
  }: CreateDownwardNetLabelSymbolParams,
  { db }: { db: CircuitJsonUtilObjects },
): void => {
  const offsets = calculateOffsets(port)

  const isLeftOrRight =
    port.facingDirection === "left" || port.facingDirection === "right"

  const horizontalEndPos = {
    x: anchorPos.x + offsets.horzPortDirection * offsets.schBoxHorzOffset,
    y: anchorPos.y + offsets.vertPortDirectionOffset * offsets.schBoxVertOffset,
  }

  const groundSymbolPos = {
    x: horizontalEndPos.x + 0.22,
    y: horizontalEndPos.y - 0.24,
  }

  db.schematic_net_label.insert({
    anchor_side: "right",
    center: groundSymbolPos,
    source_net_id: port.source_port_id!,
    text: schDisplayLabel!,
    anchor_position: groundSymbolPos,
    symbol_name: "ground_vert",
  })

  const edges = [
    {
      from: { x: anchorPos.x, y: anchorPos.y },
      to: {
        x: anchorPos.x,
        y: anchorPos.y + offsets.handleUp * offsets.schBoxVertOffset,
      },
    },
    {
      from: { x: anchorPos.x, y: anchorPos.y },
      to: horizontalEndPos,
    },
  ]

  db.schematic_trace.insert({
    edges,
    junctions: [],
    source_trace_id: source_trace_id!,
  })
}
