import type { NormalComponent } from "./NormalComponent"
import { type Bounds, type Box, getBoundingBox } from "@tscircuit/math-utils"

interface SilkscreenElementWithBounds {
  bounds: Bounds // Using standardized @tscircuit/math-utils Bounds format
  layer: string
  type: "text" | "path" | "rect" | "circle"
  pcb_component_id?: string
  element_id: string
}

/**
 * Adjust silkscreen reference designators for passive components to avoid overlaps
 * This phase runs after PCB layout is complete but before final rendering
 *
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Direct silkscreen element access: Uses rootCircuit.selectAll("silkscreen*") to get all elements directly
 * 2. Spatial filtering: Only processes silkscreen elements within search radius
 * 3. Component-aware database access: Direct .get(id) calls for fresh state
 *
 * Performance improvement: From O(N*M*K) to O(S) where:
 * - S = number of silkscreen component instances (much smaller than total DB records)
 * - No component discovery overhead - get silkscreen elements directly
 * - No complex component hierarchy traversal needed
 */
export function NormalComponent_doInitialSilkscreenOverlapAdjustment(
  component: NormalComponent<any>,
): void {
  if (component.root?.pcbDisabled) return
  const { db } = component.root!

  // Only adjust silkscreen text for components that opt in
  if (!component._adjustSilkscreenTextAutomatically) return

  // Get this component's silkscreen texts (minimal DB query)
  const componentSilkscreenTexts = component.pcb_component_id
    ? db.pcb_silkscreen_text
        .list()
        .filter((text) => text.pcb_component_id === component.pcb_component_id)
    : []

  if (componentSilkscreenTexts.length === 0) return

  // Get component center early to avoid repeated lookups
  const componentCenter = getComponentCenterFromCache(component, db)
  if (!componentCenter) return

  // Get all silkscreen elements from database (using selectAll for component discovery)
  const nearbySilkscreenElements = getAllSilkscreenElementsFromDB(
    component.root,
    db,
  )

  // For each silkscreen text, check for overlaps and adjust if needed
  for (const refText of componentSilkscreenTexts) {
    const textBounds = getSilkscreenTextBounds(refText)
    let hasOverlap = false

    // Check overlap with nearby silkscreen elements only (much faster than checking all)
    for (const element of nearbySilkscreenElements) {
      if (
        element.layer === refText.layer &&
        element.element_id !== refText.pcb_silkscreen_text_id
      ) {
        if (boundsOverlap(textBounds, element.bounds)) {
          hasOverlap = true
          break
        }
      }
    }

    if (hasOverlap) {
      // Try flipping to the opposite side
      const currentOffset = {
        x: refText.anchor_position.x - componentCenter.x,
        y: refText.anchor_position.y - componentCenter.y,
      }

      const flippedPosition = {
        x: componentCenter.x - currentOffset.x,
        y: componentCenter.y - currentOffset.y,
      }

      // Check if flipped position has no overlap
      const textWidth = textBounds.maxX - textBounds.minX
      const textHeight = textBounds.maxY - textBounds.minY
      const flippedTextBounds: Bounds = {
        minX: flippedPosition.x - textWidth / 2,
        maxX: flippedPosition.x + textWidth / 2,
        minY: flippedPosition.y - textHeight / 2,
        maxY: flippedPosition.y + textHeight / 2,
      }

      let flippedHasOverlap = false

      // Check the flipped position against nearby elements only
      for (const element of nearbySilkscreenElements) {
        if (
          element.layer === refText.layer &&
          element.element_id !== refText.pcb_silkscreen_text_id
        ) {
          if (boundsOverlap(flippedTextBounds, element.bounds)) {
            flippedHasOverlap = true
            break
          }
        }
      }

      if (!flippedHasOverlap) {
        // Update to the flipped position
        db.pcb_silkscreen_text.update(refText.pcb_silkscreen_text_id, {
          anchor_position: flippedPosition,
        })
      }
    }
  }
}

/**
 * Get all silkscreen elements from database records
 * Uses selectAll for component discovery but database records for accurate bounds
 * This is a compromise approach until component bounds are fully implemented
 */
function getAllSilkscreenElementsFromDB(
  rootCircuit: any,
  db: any,
): SilkscreenElementWithBounds[] {
  const elements: SilkscreenElementWithBounds[] = []

  // Use selectAll to discover which components exist, then get their DB records
  const silkscreenTexts = rootCircuit.selectAll("silkscreentext")
  const silkscreenPaths = rootCircuit.selectAll("silkscreenpath")
  const silkscreenRects = rootCircuit.selectAll("silkscreenrect")
  const silkscreenCircles = rootCircuit.selectAll("silkscreencircle")

  // Process silkscreen texts
  for (const textComp of silkscreenTexts) {
    const dbRecord = textComp.pcb_silkscreen_text_id
      ? db.pcb_silkscreen_text.get(textComp.pcb_silkscreen_text_id)
      : null
    if (dbRecord) {
      elements.push({
        bounds: getSilkscreenTextBounds(dbRecord),
        layer: dbRecord.layer,
        type: "text",
        pcb_component_id: dbRecord.pcb_component_id,
        element_id: dbRecord.pcb_silkscreen_text_id,
      })
    }
  }

  // Process silkscreen paths
  for (const pathComp of silkscreenPaths) {
    const dbRecord = pathComp.pcb_silkscreen_path_id
      ? db.pcb_silkscreen_path.get(pathComp.pcb_silkscreen_path_id)
      : null
    if (dbRecord) {
      elements.push({
        bounds: getSilkscreenPathBounds(dbRecord),
        layer: dbRecord.layer,
        type: "path",
        pcb_component_id: dbRecord.pcb_component_id,
        element_id: dbRecord.pcb_silkscreen_path_id,
      })
    }
  }

  // Process silkscreen rects
  for (const rectComp of silkscreenRects) {
    const dbRecord = rectComp.pcb_silkscreen_rect_id
      ? db.pcb_silkscreen_rect.get(rectComp.pcb_silkscreen_rect_id)
      : null
    if (dbRecord) {
      elements.push({
        bounds: getSilkscreenRectBounds(dbRecord),
        layer: dbRecord.layer,
        type: "rect",
        pcb_component_id: dbRecord.pcb_component_id,
        element_id: dbRecord.pcb_silkscreen_rect_id,
      })
    }
  }

  // Process silkscreen circles
  for (const circleComp of silkscreenCircles) {
    const dbRecord = circleComp.pcb_silkscreen_circle_id
      ? db.pcb_silkscreen_circle.get(circleComp.pcb_silkscreen_circle_id)
      : null
    if (dbRecord) {
      elements.push({
        bounds: getSilkscreenCircleBounds(dbRecord),
        layer: dbRecord.layer,
        type: "circle",
        pcb_component_id: dbRecord.pcb_component_id,
        element_id: dbRecord.pcb_silkscreen_circle_id,
      })
    }
  }

  return elements
}

/**
 * Get component center using component's built-in bounds system
 */
function getComponentCenterFromCache(
  component: NormalComponent<any>,
  db: any,
): { x: number; y: number } | null {
  if (!component.pcb_component_id) return null

  // Use component's built-in bounds calculation - this gives absolute position
  try {
    const componentBounds = component._getPcbCircuitJsonBounds()
    return componentBounds.center
  } catch (error) {
    // If bounds calculation fails, return null
    return null
  }
}

/**
 * Calculate bounds for silkscreen text using @tscircuit/math-utils
 */
function getSilkscreenTextBounds(text: any): Bounds {
  const charWidth = 0.6 * text.font_size
  const textWidth = text.text.length * charWidth
  const textHeight = text.font_size

  // Use Box format and getBoundingBox utility
  const textBox: Box = {
    center: { x: text.anchor_position.x, y: text.anchor_position.y },
    width: textWidth,
    height: textHeight,
  }

  return getBoundingBox(textBox)
}

/**
 * Calculate bounds for silkscreen path
 * Note: Uses custom logic since paths are polylines, not simple geometric shapes
 * that can be represented as Box objects
 */
function getSilkscreenPathBounds(path: any): Bounds {
  if (path.route.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity
  for (const point of path.route) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  const padding = path.stroke_width / 2
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  }
}

/**
 * Calculate bounds for silkscreen rect using @tscircuit/math-utils
 */
function getSilkscreenRectBounds(rect: any): Bounds {
  // Use Box format and getBoundingBox utility
  const rectBox: Box = {
    center: { x: rect.center.x, y: rect.center.y },
    width: rect.width,
    height: rect.height,
  }

  return getBoundingBox(rectBox)
}

/**
 * Calculate bounds for silkscreen circle using @tscircuit/math-utils
 */
function getSilkscreenCircleBounds(circle: any): Bounds {
  // Represent circle as a square Box and use getBoundingBox utility
  const diameter = circle.radius * 2
  const circleBox: Box = {
    center: { x: circle.center.x, y: circle.center.y },
    width: diameter,
    height: diameter,
  }

  return getBoundingBox(circleBox)
}

/**
 * Check if two bounds overlap using @tscircuit/math-utils Bounds format
 * This provides standardized bounds checking across the entire TSCircuit ecosystem
 */
function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  )
}
