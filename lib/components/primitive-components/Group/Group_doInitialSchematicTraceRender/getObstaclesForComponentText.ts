import { symbols } from "schematic-symbols"
import type { SchematicComponent } from "circuit-json"
import type { InputObstacle } from "@tscircuit/schematic-trace-solver"
import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"

const TEXT_HEIGHT = 0.18

/**
 * Estimates keep-out rectangles for a symbol-based component's rendered
 * name/value texts ({REF}/{VAL} primitives). circuit-to-svg draws the symbol
 * with its center aligned to the schematic component center, so a text
 * primitive's world position is component.center + (primitive - symbol.center).
 */
export const getObstaclesForComponentText = (args: {
  schematicComponent: SchematicComponent
  sourceComponent?: { name?: string; display_value?: string } | null
}): InputObstacle[] => {
  const { schematicComponent, sourceComponent } = args
  if (!schematicComponent.symbol_name) return []

  const symbol = (symbols as Record<string, any>)[
    schematicComponent.symbol_name
  ]
  if (!symbol) return []

  const obstacles: InputObstacle[] = []
  for (const primitive of symbol.primitives ?? []) {
    if (primitive.type !== "text") continue

    let text: string | undefined
    if (primitive.text === "{REF}") {
      text = sourceComponent?.name
    } else if (primitive.text === "{VAL}") {
      text = sourceComponent?.display_value
    }
    if (!text) continue

    const width = getSchematicNetLabelTextWidth({ text })
    const anchorX =
      schematicComponent.center.x + primitive.x - (symbol.center?.x ?? 0)
    const anchorY =
      schematicComponent.center.y + primitive.y - (symbol.center?.y ?? 0)

    let center = { x: anchorX, y: anchorY }
    switch (primitive.anchor) {
      case "middle_top":
        center = { x: anchorX, y: anchorY - TEXT_HEIGHT / 2 }
        break
      case "middle_bottom":
        center = { x: anchorX, y: anchorY + TEXT_HEIGHT / 2 }
        break
      case "middle_left":
        center = { x: anchorX + width / 2, y: anchorY }
        break
      case "middle_right":
        center = { x: anchorX - width / 2, y: anchorY }
        break
    }

    obstacles.push({
      obstacleId: `text-${schematicComponent.schematic_component_id}-${primitive.text}`,
      center,
      width,
      height: TEXT_HEIGHT,
    })
  }

  return obstacles
}
