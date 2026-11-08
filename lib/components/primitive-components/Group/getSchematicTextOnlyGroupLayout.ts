import { getBoundsFromPoints } from "@tscircuit/math-utils"
import { Group } from "./Group"
import { SchematicText } from "../SchematicText"
import { getSchematicTextBounds } from "./Group_doInitialSchematicTraceRender/getSchematicTextBounds"

/** Bounds and center points in right-handed schematic world space (mm, +X right, +Y up). */
export function getSchematicTextOnlyGroupLayout(group: Group) {
  const { db } = group.root!
  const descendants = group.getDescendants()
  if (
    descendants.some(
      (child) => !(child instanceof Group) && !(child instanceof SchematicText),
    )
  ) {
    return null
  }

  const schematicGroup = db.schematic_group.get(group.schematic_group_id!)
  if (!schematicGroup) return null
  const texts = descendants
    .filter((child): child is SchematicText => child instanceof SchematicText)
    .flatMap((child) => {
      const text = db.schematic_text.get(child.schematic_text_id!)
      return text ? [text] : []
    })
  const bounds = getBoundsFromPoints(
    texts.flatMap((text) => {
      const bounds = getSchematicTextBounds(text)
      return [
        { x: bounds.minX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.maxY },
      ]
    }),
  )

  return {
    schematicGroup,
    texts,
    schematicGroups: [
      group,
      ...descendants.filter((child): child is Group => child instanceof Group),
    ].flatMap((child) => {
      const schematicGroup = db.schematic_group.get(child.schematic_group_id!)
      return schematicGroup ? [schematicGroup] : []
    }),
    center: bounds
      ? {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2,
        }
      : schematicGroup.center,
    width:
      group._parsedProps.schWidth ?? (bounds ? bounds.maxX - bounds.minX : 0),
    height:
      group._parsedProps.schHeight ?? (bounds ? bounds.maxY - bounds.minY : 0),
  }
}
