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

export const createDownwardNetLabelSymbol = (
  {
    fromPort,
    toPort,
    fromAnchorPos,
    toAnchorPos,
    schDisplayLabel,
    source_trace_id,
  }: CreateDownwardNetLabelSymbolParams,
  db: SoupUtilObjects,
): void => {
  // Insert ground symbol components for both ports
  const fromSchBoxVertOffset = fromPort.parent?.config
    .shouldRenderAsSchematicBox
    ? 3
    : 1
  const fromSchBoxHorzOffset =
    fromPort.parent?.config.shouldRenderAsSchematicBox &&
    (fromPort.facingDirection === "left" ||
      fromPort.facingDirection === "right")
      ? 3
      : 1
  const fromHorzPortDirection =
    fromPort.facingDirection === "left"
      ? -0.5
      : fromPort.facingDirection === "down"
        ? 0
        : 0.5
  const fromVertPortDirectionOffset =
    fromPort.facingDirection === "up"
      ? 0.5
      : fromPort.facingDirection === "down"
        ? -0.5
        : 0
  const fromHandelUp = fromPort.facingDirection === "up" ? 0.5 : 0
  db.schematic_net_label.insert({
    anchor_side: "top",
    center: {
      x: fromAnchorPos.x + fromHorzPortDirection * fromSchBoxHorzOffset,
      y: fromAnchorPos.y + fromVertPortDirectionOffset * fromSchBoxVertOffset,
    },
    source_net_id: fromPort.source_port_id!,
    text: schDisplayLabel!,
    anchor_position: {
      x: fromAnchorPos.x + fromHorzPortDirection * fromSchBoxHorzOffset,
      y: fromAnchorPos.y + fromVertPortDirectionOffset * fromSchBoxVertOffset,
    },
    symbol_name: "ground_horz",
  })
  db.schematic_trace.insert({
    edges: [
      {
        from: {
          x: fromAnchorPos.x,
          y: fromAnchorPos.y,
        },
        to: {
          x: fromAnchorPos.x,
          y: fromAnchorPos.y + fromHandelUp * fromSchBoxVertOffset,
        },
      },

      {
        from: {
          x: fromAnchorPos.x,
          y: fromAnchorPos.y,
        },
        to: {
          x: fromAnchorPos.x + fromHorzPortDirection * fromSchBoxHorzOffset,
          y:
            fromAnchorPos.y +
            fromVertPortDirectionOffset * fromSchBoxVertOffset,
        },
      },
    ],
    junctions: [
      {
        x: fromAnchorPos.x + fromHorzPortDirection * fromSchBoxHorzOffset,
        y: fromAnchorPos.y + fromVertPortDirectionOffset * fromSchBoxVertOffset,
      },
    ],
    source_trace_id: source_trace_id!,
  })

  const toSchBoxVertOffset = toPort.parent?.config.shouldRenderAsSchematicBox
    ? 3
    : 1
  const toSchBoxHorzOffset =
    toPort.parent?.config.shouldRenderAsSchematicBox &&
    (toPort.facingDirection === "left" || toPort.facingDirection === "right")
      ? 3
      : 1
  const toHorzPortDirectionOffset =
    toPort.facingDirection === "left"
      ? -0.5
      : toPort.facingDirection === "down"
        ? 0
        : 0.5
  const toVertPortDirectionOffset =
    toPort.facingDirection === "up"
      ? 0.5
      : toPort.facingDirection === "down"
        ? -0.5
        : 0

  db.schematic_net_label.insert({
    anchor_side: "top",
    center: {
      x: toAnchorPos.x + toHorzPortDirectionOffset * toSchBoxHorzOffset,
      y: toAnchorPos.y + toVertPortDirectionOffset * toSchBoxVertOffset,
    },
    source_net_id: toPort.source_port_id!,
    text: schDisplayLabel!,
    anchor_position: {
      x: toAnchorPos.x + toHorzPortDirectionOffset * toSchBoxHorzOffset,
      y: toAnchorPos.y + toVertPortDirectionOffset * toSchBoxVertOffset,
    },
    symbol_name: "ground_horz",
  })
  const toHandelUp = toPort.facingDirection === "up" ? 0.5 : 0
  db.schematic_trace.insert({
    edges: [
      {
        from: {
          x: toAnchorPos.x,
          y: toAnchorPos.y,
        },
        to: {
          x: toAnchorPos.x,
          y: toAnchorPos.y + toHandelUp * toSchBoxVertOffset,
        },
      },

      {
        from: {
          x: toAnchorPos.x,
          y: toAnchorPos.y,
        },
        to: {
          x: toAnchorPos.x + toHorzPortDirectionOffset * toSchBoxHorzOffset,
          y: toAnchorPos.y + toVertPortDirectionOffset * toSchBoxVertOffset,
        },
      },
    ],
    junctions: [
      {
        x: toAnchorPos.x + toHorzPortDirectionOffset * toSchBoxHorzOffset,
        y: toAnchorPos.y + toVertPortDirectionOffset * toSchBoxVertOffset,
      },
    ],
    source_trace_id: source_trace_id!,
  })
}
