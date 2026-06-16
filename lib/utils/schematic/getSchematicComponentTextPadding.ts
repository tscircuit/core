import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicComponent, SourceComponentBase } from "circuit-json"
import { symbols } from "schematic-symbols"
import { getSchematicNetLabelTextWidth } from "./computeSchematicNetLabelCenter"

export interface TextMargins {
  left: number
  right: number
  top: number
  bottom: number
}

interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const ZERO_MARGINS: TextMargins = { left: 0, right: 0, top: 0, bottom: 0 }

const SYMBOL_TEXT_FONT_SIZE = 0.18

const TEXT_BOX_ENABLED_FTYPES = new Set(["simple_resistor"])

function getTextBounds({
  text,
  position,
  anchor,
  fontSize,
}: {
  text: string
  position: { x: number; y: number }
  anchor: string
  fontSize: number
}): Bounds {
  const width = getSchematicNetLabelTextWidth({ text, font_size: fontSize })
  const height = fontSize

  let relMinX: number
  let relMaxX: number
  if (anchor.includes("left")) {
    relMinX = 0
    relMaxX = width
  } else if (anchor.includes("right")) {
    relMinX = -width
    relMaxX = 0
  } else {
    relMinX = -width / 2
    relMaxX = width / 2
  }

  let relMinY: number
  let relMaxY: number
  if (anchor.includes("top")) {
    relMinY = -height
    relMaxY = 0
  } else if (anchor.includes("bottom")) {
    relMinY = 0
    relMaxY = height
  } else {
    relMinY = -height / 2
    relMaxY = height / 2
  }

  return {
    minX: position.x + relMinX,
    maxX: position.x + relMaxX,
    minY: position.y + relMinY,
    maxY: position.y + relMaxY,
  }
}

function getSymbolTextBounds(
  schematicComponent: SchematicComponent,
  sourceComponent: SourceComponentBase | undefined,
): Bounds[] {
  if (!schematicComponent.symbol_name) return []
  const symbol = (symbols as any)[schematicComponent.symbol_name]
  if (!symbol?.primitives || !symbol.center) return []

  const bounds: Bounds[] = []
  for (const primitive of symbol.primitives) {
    if (primitive.type !== "text") continue

    let value: string
    if (primitive.text === "{REF}") {
      value = sourceComponent?.display_name ?? sourceComponent?.name ?? ""
    } else if (primitive.text === "{VAL}") {
      value = schematicComponent.symbol_display_value ?? ""
    } else {
      value = primitive.text ?? ""
    }
    if (!value) continue

    bounds.push(
      getTextBounds({
        text: value,
        position: {
          x: primitive.x - symbol.center.x + schematicComponent.center.x,
          y: primitive.y - symbol.center.y + schematicComponent.center.y,
        },
        anchor: primitive.anchor ?? "center",
        fontSize: SYMBOL_TEXT_FONT_SIZE,
      }),
    )
  }
  return bounds
}

export function getSchematicComponentTextMargins(
  db: CircuitJsonUtilObjects,
  schematicComponent: SchematicComponent,
): TextMargins {
  if (!schematicComponent.center || !schematicComponent.size) {
    return { ...ZERO_MARGINS }
  }

  const sourceComponent = schematicComponent.source_component_id
    ? db.source_component.get(schematicComponent.source_component_id)
    : undefined
  if (!sourceComponent || !TEXT_BOX_ENABLED_FTYPES.has(sourceComponent.ftype)) {
    return { ...ZERO_MARGINS }
  }

  const textBounds = getSymbolTextBounds(schematicComponent, sourceComponent)
  if (textBounds.length === 0) return { ...ZERO_MARGINS }

  const halfWidth = schematicComponent.size.width / 2
  const halfHeight = schematicComponent.size.height / 2
  const compMinX = schematicComponent.center.x - halfWidth
  const compMaxX = schematicComponent.center.x + halfWidth
  const compMinY = schematicComponent.center.y - halfHeight
  const compMaxY = schematicComponent.center.y + halfHeight

  const margins: TextMargins = { ...ZERO_MARGINS }
  for (const bounds of textBounds) {
    margins.left = Math.max(margins.left, compMinX - bounds.minX)
    margins.right = Math.max(margins.right, bounds.maxX - compMaxX)
    margins.top = Math.max(margins.top, bounds.maxY - compMaxY)
    margins.bottom = Math.max(margins.bottom, compMinY - bounds.minY)
  }

  margins.left = Math.max(0, margins.left)
  margins.right = Math.max(0, margins.right)
  margins.top = Math.max(0, margins.top)
  margins.bottom = Math.max(0, margins.bottom)

  return margins
}

export function getSchematicComponentBoxTextPadding(
  db: CircuitJsonUtilObjects,
  schematicComponent: SchematicComponent,
): TextMargins {
  const margins = getSchematicComponentTextMargins(db, schematicComponent)

  const isVertical =
    (schematicComponent.size?.height ?? 0) >
    (schematicComponent.size?.width ?? 0)

  if (isVertical) {
    return margins
  }

  const padX = Math.max(margins.left, margins.right)
  const padY = Math.max(margins.top, margins.bottom)
  return { left: padX, right: padX, top: padY, bottom: padY }
}
