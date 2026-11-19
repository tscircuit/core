import type {
  NinePointAnchor as CircuitJsonAnchor,
  SchematicPort,
} from "circuit-json"
import { SCHEMATIC_COMPONENT_OUTLINE_COLOR } from "lib/utils/constants"
import { getRelativeDirection } from "lib/utils/get-relative-direction"
import type { TextPrimitive } from "schematic-symbols"
import type { SchematicSymbol } from "./SchematicSymbol"
import { getSchematicSymbolWithRotation } from "./getSchematicSymbolWithRotation"

type SymbolNinePointAnchor = TextPrimitive["anchor"]

const SYMBOL_ANCHOR_TO_CIRCUIT_JSON_ANCHOR: Record<
  SymbolNinePointAnchor,
  CircuitJsonAnchor
> = {
  top_left: "top_left",
  top_right: "top_right",
  bottom_left: "bottom_left",
  bottom_right: "bottom_right",
  middle_top: "top_center",
  middle_bottom: "bottom_center",
  middle_left: "center_left",
  middle_right: "center_right",
  center: "center",
}

const REFERENCE_LABEL_COLOR = "rgb(15, 15, 15)"

export const SchematicSymbol_doInitialSchematicComponentRender = (
  schematicSymbol: SchematicSymbol,
): void => {
  if (schematicSymbol.root?.schematicDisabled) return
  if (schematicSymbol.getCollapsedSchematicBoxAncestor()) return

  const { db } = schematicSymbol.root!
  const resolved = getSchematicSymbolWithRotation(schematicSymbol)
  const { symbol } = resolved

  const center = schematicSymbol._getGlobalSchematicPositionBeforeLayout()
  const schematicSheetId = schematicSymbol._resolveSchematicSheetId()
  const subcircuitId =
    schematicSymbol.getSubcircuit().subcircuit_id ?? undefined

  const schematicComponent = db.schematic_component.insert({
    center,
    size: { ...symbol.size },
    is_box_with_pins: resolved.mode === "native",
    ...(resolved.mode === "native" ? { symbol_name: resolved.symbolName } : {}),
    source_component_id: schematicSymbol.source_component_id ?? undefined,
    schematic_sheet_id: schematicSheetId,
    subcircuit_id: subcircuitId,
  })

  schematicSymbol.schematic_component_id =
    schematicComponent.schematic_component_id

  const toWorldPoint = (point: { x: number; y: number }) => ({
    x: center.x + point.x - symbol.center.x,
    y: center.y + point.y - symbol.center.y,
  })

  for (const symbolPort of symbol.ports) {
    const port = schematicSymbol.getPortForSymbolPort(symbolPort)
    if (!port?.source_port_id) {
      throw new Error(
        `Missing source port for schematic symbol port "${symbolPort.labels.join("/")}" on ${schematicSymbol.getString()}`,
      )
    }
    const portCenter = toWorldPoint(symbolPort)

    const schematicPort = db.schematic_port.insert({
      schematic_component_id: schematicComponent.schematic_component_id,
      center: portCenter,
      source_port_id: port.source_port_id,
      facing_direction: getRelativeDirection(
        center,
        portCenter,
      ) as SchematicPort["facing_direction"],
      distance_from_component_edge: 0.4,
      pin_number: port._parsedProps.pinNumber,
      display_pin_label: port._parsedProps.aliases?.[0],
      is_connected: false,
      schematic_sheet_id: schematicSheetId,
      subcircuit_id: subcircuitId,
    })
    port.schematic_port_id = schematicPort.schematic_port_id
  }

  if (resolved.mode !== "custom_rotated") return

  for (const primitive of symbol.primitives) {
    if (primitive.type === "path") {
      const points = primitive.points.map(toWorldPoint)
      if (primitive.closed && points.length > 1) {
        const first = points[0]!
        const last = points[points.length - 1]!
        if (first.x !== last.x || first.y !== last.y) {
          points.push(first)
        }
      }
      const isClosedArea = Boolean(
        primitive.fill && primitive.closed && points.length > 2,
      )
      db.schematic_path.insert({
        schematic_component_id: schematicComponent.schematic_component_id,
        points,
        is_filled: isClosedArea,
        is_dashed: false,
        stroke_color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        fill_color: isClosedArea
          ? SCHEMATIC_COMPONENT_OUTLINE_COLOR
          : undefined,
        stroke_width: 0.02,
        subcircuit_id: subcircuitId,
        schematic_sheet_id: schematicSheetId,
      })
    } else if (primitive.type === "circle") {
      db.schematic_circle.insert({
        schematic_component_id: schematicComponent.schematic_component_id,
        center: toWorldPoint({ x: primitive.x, y: primitive.y }),
        radius: primitive.radius,
        stroke_width: 0.02,
        color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        is_filled: primitive.fill,
        fill_color: primitive.fill
          ? SCHEMATIC_COMPONENT_OUTLINE_COLOR
          : undefined,
        is_dashed: false,
        subcircuit_id: subcircuitId,
        schematic_sheet_id: schematicSheetId,
      })
    } else if (primitive.type === "box") {
      const c1 = toWorldPoint({ x: primitive.x, y: primitive.y })
      const c2 = toWorldPoint({
        x: primitive.x + primitive.width,
        y: primitive.y + primitive.height,
      })
      db.schematic_rect.insert({
        schematic_component_id: schematicComponent.schematic_component_id,
        center: {
          x: (c1.x + c2.x) / 2,
          y: (c1.y + c2.y) / 2,
        },
        width: Math.abs(c2.x - c1.x),
        height: Math.abs(c2.y - c1.y),
        stroke_width: 0.02,
        color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        is_filled: false,
        is_dashed: false,
        rotation: 0,
        subcircuit_id: subcircuitId,
        schematic_sheet_id: schematicSheetId,
      })
    } else if (primitive.type === "text") {
      const isRef = primitive.text === "{REF}"
      const isVal = primitive.text === "{VAL}"
      const resolvedText = isRef
        ? (schematicSymbol._parsedProps.displayName ??
          schematicSymbol.name ??
          "")
        : isVal
          ? ""
          : primitive.text

      if (!resolvedText) continue

      db.schematic_text.insert({
        schematic_component_id: schematicComponent.schematic_component_id,
        position: toWorldPoint({ x: primitive.x, y: primitive.y }),
        text: resolvedText,
        anchor: SYMBOL_ANCHOR_TO_CIRCUIT_JSON_ANCHOR[primitive.anchor],
        rotation: 0,
        font_size: 0.18,
        color:
          isRef || isVal
            ? REFERENCE_LABEL_COLOR
            : SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        schematic_sheet_id: schematicSheetId,
        subcircuit_id: subcircuitId,
      })
    }
  }
}
