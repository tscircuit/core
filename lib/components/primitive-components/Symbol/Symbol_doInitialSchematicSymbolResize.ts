import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import {
  compose,
  translate,
  scale,
  applyToPoint,
  type Matrix,
} from "transformation-matrix"
import type { SymbolComponent } from "./Symbol"

/**
 * After schematic primitives are rendered, scale and reposition them
 * if the Symbol has width/height props specified.
 */
export function Symbol_doInitialSchematicSymbolResize(
  symbol: SymbolComponent,
): void {
  if (symbol.root?.schematicDisabled) return

  const { _parsedProps: props } = symbol
  const targetWidth = props.width
  const targetHeight = props.height

  // Only resize if width or height is specified
  if (targetWidth === undefined && targetHeight === undefined) return

  const { db } = symbol.root!

  // Collect all schematic primitive elements from children
  const schematicElements: any[] = []
  const collectSchematicPrimitives = (children: any[]) => {
    for (const child of children) {
      if (
        child.isSchematicPrimitive &&
        child.componentName === "SchematicLine"
      ) {
        const line = db.schematic_line.get(child.schematic_line_id)
        if (line) schematicElements.push(line)
      }
      if (
        child.isSchematicPrimitive &&
        child.componentName === "SchematicRect"
      ) {
        const rect = db.schematic_rect.get(child.schematic_rect_id)
        if (rect) schematicElements.push(rect)
      }
      if (
        child.isSchematicPrimitive &&
        child.componentName === "SchematicCircle"
      ) {
        const circle = db.schematic_circle.get(child.schematic_circle_id)
        if (circle) schematicElements.push(circle)
      }
      if (
        child.isSchematicPrimitive &&
        child.componentName === "SchematicArc"
      ) {
        const arc = db.schematic_arc.get(child.schematic_arc_id)
        if (arc) schematicElements.push(arc)
      }
      if (
        child.isSchematicPrimitive &&
        child.componentName === "SchematicText"
      ) {
        const text = db.schematic_text.get(child.schematic_text_id)
        if (text) schematicElements.push(text)
      }
      // Recursively check children
      if (child.children && child.children.length > 0) {
        collectSchematicPrimitives(child.children)
      }
    }
  }
  collectSchematicPrimitives(symbol.children)

  if (schematicElements.length === 0) return

  // Calculate current bounds
  const bounds = getBoundsForSchematic(schematicElements)
  const currentWidth = bounds.maxX - bounds.minX
  const currentHeight = bounds.maxY - bounds.minY

  if (currentWidth === 0 && currentHeight === 0) return

  // Calculate the current center of the content
  const currentCenterX = (bounds.minX + bounds.maxX) / 2
  const currentCenterY = (bounds.minY + bounds.maxY) / 2

  // Calculate scale factors
  const scaleX =
    targetWidth !== undefined && currentWidth > 0
      ? targetWidth / currentWidth
      : 1
  const scaleY =
    targetHeight !== undefined && currentHeight > 0
      ? targetHeight / currentHeight
      : 1

  // Get the global position for the Symbol (where the content should be centered)
  const globalPos = symbol._getGlobalSchematicPositionBeforeLayout()

  // Build transformation matrix:
  // 1. Translate content center to origin
  // 2. Scale
  // 3. Translate to global position
  const transform: Matrix = compose(
    translate(globalPos.x, globalPos.y),
    scale(scaleX, scaleY),
    translate(-currentCenterX, -currentCenterY),
  )

  // Helper to transform a point and return { x, y } format
  const transformPoint = (point: { x: number; y: number }) => {
    const result = applyToPoint(transform, point)
    return { x: result.x, y: result.y }
  }

  // Update each element in the database
  for (const elm of schematicElements) {
    if (elm.type === "schematic_line") {
      const p1 = transformPoint({ x: elm.x1, y: elm.y1 })
      const p2 = transformPoint({ x: elm.x2, y: elm.y2 })
      db.schematic_line.update(elm.schematic_line_id, {
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
      })
    } else if (elm.type === "schematic_rect") {
      const newCenter = transformPoint(elm.center)
      db.schematic_rect.update(elm.schematic_rect_id, {
        center: newCenter,
        width: elm.width * scaleX,
        height: elm.height * scaleY,
      })
    } else if (elm.type === "schematic_circle") {
      const newCenter = transformPoint(elm.center)
      // Use uniform scale for circles (use the smaller scale to preserve aspect ratio)
      const uniformScale = Math.min(scaleX, scaleY)
      db.schematic_circle.update(elm.schematic_circle_id, {
        center: newCenter,
        radius: elm.radius * uniformScale,
      })
    } else if (elm.type === "schematic_arc") {
      const newCenter = transformPoint(elm.center)
      // Use uniform scale for arcs to preserve shape
      const uniformScale = Math.min(scaleX, scaleY)
      db.schematic_arc.update(elm.schematic_arc_id, {
        center: newCenter,
        radius: elm.radius * uniformScale,
      })
    } else if (elm.type === "schematic_text") {
      const newPosition = transformPoint(elm.position)
      db.schematic_text.update(elm.schematic_text_id, {
        position: newPosition,
      })
    }
  }
}
