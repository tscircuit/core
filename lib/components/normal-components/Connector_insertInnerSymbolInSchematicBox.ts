import { SCHEMATIC_COMPONENT_OUTLINE_COLOR } from "lib/utils/constants"
import type { SchSymbol } from "schematic-symbols"
import type { Connector } from "./Connector"

/**
 * Insert a schematic-symbols symbol as inner primitives inside the
 * schematic box. The primitives are scaled to 50% of the box size and
 * centered.
 */
export function insertInnerSymbolInSchematicBox(
  connector: Connector,
  symbol: SchSymbol,
): void {
  if (!connector.schematic_component_id || !connector.root) return

  const { db } = connector.root
  const schematicComponent = db.schematic_component.get(
    connector.schematic_component_id,
  )
  if (!schematicComponent) return
  if (schematicComponent.symbol_name) return

  const innerScaleFactor = 0.5
  const targetWidth = schematicComponent.size.width * innerScaleFactor
  const targetHeight = schematicComponent.size.height * innerScaleFactor
  const scaleFactor = Math.min(
    targetWidth / symbol.size.width,
    targetHeight / symbol.size.height,
  )
  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) return

  const subcircuit_id = connector.getSubcircuit()?.subcircuit_id ?? undefined
  const center = schematicComponent.center
  const symbolCenter = symbol.center

  const transformPoint = (point: { x: number; y: number }) => ({
    x: center.x + (point.x - symbolCenter.x) * scaleFactor,
    y: center.y + (point.y - symbolCenter.y) * scaleFactor,
  })

  for (const primitive of symbol.primitives) {
    if (primitive.type === "path") {
      const points = primitive.points.map(transformPoint)
      if (primitive.closed && points.length > 1) {
        const first = points[0]
        const last = points[points.length - 1]
        if (first.x !== last.x || first.y !== last.y) {
          points.push(first)
        }
      }
      db.schematic_path.insert({
        schematic_component_id: connector.schematic_component_id,
        points,
        is_filled: primitive.fill ?? false,
        fill_color: primitive.fill
          ? SCHEMATIC_COMPONENT_OUTLINE_COLOR
          : undefined,
        stroke_width: 0.02,
        subcircuit_id,
      })
    } else if (primitive.type === "circle") {
      db.schematic_circle.insert({
        schematic_component_id: connector.schematic_component_id,
        center: transformPoint({ x: primitive.x, y: primitive.y }),
        radius: primitive.radius * scaleFactor,
        stroke_width: 0.02,
        color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        is_filled: primitive.fill,
        fill_color: primitive.fill
          ? SCHEMATIC_COMPONENT_OUTLINE_COLOR
          : undefined,
        is_dashed: false,
        subcircuit_id,
      })
    } else if (primitive.type === "box") {
      const topLeft = transformPoint({ x: primitive.x, y: primitive.y })
      const bottomRight = transformPoint({
        x: primitive.x + primitive.width,
        y: primitive.y + primitive.height,
      })
      db.schematic_rect.insert({
        schematic_component_id: connector.schematic_component_id,
        center: {
          x: (topLeft.x + bottomRight.x) / 2,
          y: (topLeft.y + bottomRight.y) / 2,
        },
        width: Math.abs(bottomRight.x - topLeft.x),
        height: Math.abs(bottomRight.y - topLeft.y),
        stroke_width: 0.02,
        color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        is_filled: false,
        is_dashed: false,
        rotation: 0,
        subcircuit_id,
      })
    }
  }
}
