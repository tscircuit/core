import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { Bounds } from "@tscircuit/math-utils"
import { getBoundFromCenteredRect } from "@tscircuit/math-utils"
import type { SchematicComponent, SourceComponentBase } from "circuit-json"
import { symbols } from "schematic-symbols"
import { getSchematicNetLabelTextWidth } from "./computeSchematicNetLabelCenter"

const SYMBOL_TEXT_FONT_SIZE = 0.18

const TEXT_BOX_ENABLED_FTYPES = new Set(["simple_resistor", "simple_capacitor"])

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

function getSymbolTextBounds({
  schematicComponent,
  sourceComponent,
}: {
  schematicComponent: SchematicComponent
  sourceComponent: SourceComponentBase | undefined
}): Bounds[] {
  if (!schematicComponent.symbol_name) return []
  const symbol = (symbols as any)[schematicComponent.symbol_name]
  if (!symbol?.primitives || !symbol.center) return []

  const textBounds: Bounds[] = []
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

    textBounds.push(
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
  return textBounds
}

function getSymbolBoxBounds(schematicComponent: SchematicComponent): Bounds {
  return getBoundFromCenteredRect({
    center: schematicComponent.center,
    width: schematicComponent.size.width,
    height: schematicComponent.size.height,
  })
}

/**
 * Bounding box of a schematic component including its rendered {REF}/{VAL}
 * text. Returns null when the component has no text extending past its symbol
 * box (e.g. non-resistor components or text that fits within the symbol).
 */
function getSchematicComponentTextInclusiveBounds(
  db: CircuitJsonUtilObjects,
  schematicComponent: SchematicComponent,
): Bounds | null {
  if (!schematicComponent.center || !schematicComponent.size) return null

  const sourceComponent = schematicComponent.source_component_id
    ? db.source_component.get(schematicComponent.source_component_id)
    : undefined
  if (!sourceComponent || !TEXT_BOX_ENABLED_FTYPES.has(sourceComponent.ftype)) {
    return null
  }

  const textBounds = getSymbolTextBounds({
    schematicComponent,
    sourceComponent,
  })
  if (textBounds.length === 0) return null

  const boxBounds = getSymbolBoxBounds(schematicComponent)
  const bounds: Bounds = { ...boxBounds }
  for (const textBound of textBounds) {
    bounds.minX = Math.min(bounds.minX, textBound.minX)
    bounds.maxX = Math.max(bounds.maxX, textBound.maxX)
    bounds.minY = Math.min(bounds.minY, textBound.minY)
    bounds.maxY = Math.max(bounds.maxY, textBound.maxY)
  }

  if (
    bounds.minX === boxBounds.minX &&
    bounds.maxX === boxBounds.maxX &&
    bounds.minY === boxBounds.minY &&
    bounds.maxY === boxBounds.maxY
  ) {
    return null
  }

  return bounds
}

/**
 * Text-inclusive bounding box used for schematic layout/packing. Horizontal
 * components are expanded symmetrically about their center so they stay
 * centered in their packing cell; vertical components keep the raw
 * text-inclusive bounds. Returns null when there is no text past the symbol.
 */
export function getSchematicComponentWithTextBounds(
  db: CircuitJsonUtilObjects,
  schematicComponent: SchematicComponent,
): Bounds | null {
  const textBounds = getSchematicComponentTextInclusiveBounds(
    db,
    schematicComponent,
  )
  if (!textBounds) return null

  const boxBounds = getSymbolBoxBounds(schematicComponent)

  const isVertical =
    schematicComponent.size.height > schematicComponent.size.width
  if (isVertical) return textBounds

  const padX = Math.max(
    boxBounds.minX - textBounds.minX,
    textBounds.maxX - boxBounds.maxX,
  )
  const padY = Math.max(
    textBounds.maxY - boxBounds.maxY,
    boxBounds.minY - textBounds.minY,
  )
  return getBoundFromCenteredRect({
    center: schematicComponent.center,
    width: schematicComponent.size.width + 2 * padX,
    height: schematicComponent.size.height + 2 * padY,
  })
}
