import type { SchematicText } from "circuit-json"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"

export function getSchematicTextBounds(text: SchematicText) {
  const fontSize = text.font_size ?? 0.18
  const width = getSchematicNetLabelTextWidth({
    text: text.text ?? "",
    font_size: fontSize,
  })
  const height = fontSize
  const anchor = text.anchor ?? "center"

  let minX: number
  let maxX: number
  if (anchor.includes("left")) {
    minX = 0
    maxX = width
  } else if (anchor.includes("right")) {
    minX = -width
    maxX = 0
  } else {
    minX = -width / 2
    maxX = width / 2
  }

  let minY: number
  let maxY: number
  if (anchor.includes("top")) {
    minY = -height
    maxY = 0
  } else if (anchor.includes("bottom")) {
    minY = 0
    maxY = height
  } else {
    minY = -height / 2
    maxY = height / 2
  }

  const rotation = ((text.rotation ?? 0) * Math.PI) / 180
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const corners = [
    { x: minX, y: minY },
    { x: minX, y: maxY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
  ].map((corner) => ({
    x: text.position.x + corner.x * cos - corner.y * sin,
    y: text.position.y + corner.x * sin + corner.y * cos,
  }))

  return getBoundsFromPoints(corners)!
}
