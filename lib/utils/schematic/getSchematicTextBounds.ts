import type { Bounds, Point } from "@tscircuit/math-utils"
import type { SchematicText } from "circuit-json"
import { getSchematicNetLabelTextWidth } from "./computeSchematicNetLabelCenter"

function rotatePoint(
  point: Point,
  center: Point,
  rotationDegrees: number,
): Point {
  if (!rotationDegrees) return point

  const rotationRadians = (rotationDegrees * Math.PI) / 180
  const cos = Math.cos(rotationRadians)
  const sin = Math.sin(rotationRadians)
  const dx = point.x - center.x
  const dy = point.y - center.y

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

export function getSchematicTextBounds(
  schematicText: Pick<
    SchematicText,
    "anchor" | "font_size" | "position" | "rotation" | "text"
  >,
): Bounds | null {
  if (!schematicText.text) return null

  const fontSize = schematicText.font_size
  const position = schematicText.position
  if (
    typeof fontSize !== "number" ||
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number"
  ) {
    return null
  }

  const width = getSchematicNetLabelTextWidth({
    text: schematicText.text,
    font_size: fontSize,
  })
  const height = fontSize
  const anchor = schematicText.anchor ?? "center"

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

  const corners = [
    { x: position.x + relMinX, y: position.y + relMinY },
    { x: position.x + relMaxX, y: position.y + relMinY },
    { x: position.x + relMaxX, y: position.y + relMaxY },
    { x: position.x + relMinX, y: position.y + relMaxY },
  ].map((point) => rotatePoint(point, position, schematicText.rotation ?? 0))

  return {
    minX: Math.min(...corners.map((point) => point.x)),
    maxX: Math.max(...corners.map((point) => point.x)),
    minY: Math.min(...corners.map((point) => point.y)),
    maxY: Math.max(...corners.map((point) => point.y)),
  }
}
