import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getBoundFromCenteredRect, type Bounds } from "@tscircuit/math-utils"
import type { SchematicComponent, SchematicSymbol } from "circuit-json"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import { symbols, type SchSymbol } from "schematic-symbols"

export type SchematicSymbolId = SchematicSymbol["schematic_symbol_id"]

/**
 * Body centerline bounds in schematic world mm (+X right, +Y up). Text and
 * external port stems are separate geometry, not part of this rectangle.
 * Named symbols are already oriented: Port._getGlobalSchematicPositionBeforeLayout
 * places their points relative to symbol.center. Custom primitives are already
 * transformed into world coordinates by core's render/layout phases.
 */
export function getSchematicComponentBodyBounds({
  db,
  schematicComponent,
  schematicSymbolIds,
}: {
  db: CircuitJsonUtilObjects
  schematicComponent: SchematicComponent
  schematicSymbolIds: Set<SchematicSymbolId>
}): Bounds {
  const symbol = schematicComponent.symbol_name
    ? (symbols as unknown as Record<string, SchSymbol>)[
        schematicComponent.symbol_name
      ]
    : undefined
  if (symbol) {
    const body = symbol.primitives.flatMap<object>((primitive) => {
      if (primitive.type === "path")
        return [{ type: "schematic_path", points: primitive.points }]
      if (primitive.type === "circle")
        return [
          {
            type: "schematic_circle",
            center: primitive,
            radius: primitive.radius,
          },
        ]
      if (primitive.type === "box")
        return [
          {
            type: "schematic_rect",
            center: {
              x: primitive.x + primitive.width / 2,
              y: primitive.y - primitive.height / 2,
            },
            width: primitive.width,
            height: primitive.height,
          },
        ]
      return []
    })
    if (body.length) {
      const bounds = getBoundsForSchematic(body)
      const dx = schematicComponent.center.x - symbol.center.x
      const dy = schematicComponent.center.y - symbol.center.y
      return {
        minX: bounds.minX + dx,
        maxX: bounds.maxX + dx,
        minY: bounds.minY + dy,
        maxY: bounds.maxY + dy,
      }
    }
  }

  const body = [
    ...db.schematic_path.list(),
    ...db.schematic_line.list(),
    ...db.schematic_rect.list(),
    ...db.schematic_circle.list(),
    ...db.schematic_arc.list(),
  ].filter(
    (primitive) =>
      primitive.schematic_symbol_id &&
      schematicSymbolIds.has(primitive.schematic_symbol_id),
  )
  if (body.length) return getBoundsForSchematic(body)

  // Box components already have explicit body dimensions. Do not enlarge
  // them to include their terminals, pin labels, reference, or value.
  return getBoundFromCenteredRect({
    center: schematicComponent.center,
    ...schematicComponent.size,
  })
}
