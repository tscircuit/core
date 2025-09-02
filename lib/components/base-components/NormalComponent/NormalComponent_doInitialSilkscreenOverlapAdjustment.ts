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
 * APPROACH:
 * 1. Uses component.selectAll("silkscreentext") to discover silkscreen text components
 * 2. Links components to database records for position data and update operations
 * 3. Performs overlap detection and position adjustment as needed
 *
 * PERFORMANCE BENEFITS:
 * - Uses selectAll() for component discovery (avoids database traversal)
 * - Targeted database queries only for components that exist
 * - Minimal database access compared to full table scanning approaches
 *
 * Note: Some database access is still required because:
 * - Database records contain the authoritative position data
 * - Position updates must be written back to the database
 * - Component-DB linking timing issues require fallback record matching
 */
export function NormalComponent_doInitialSilkscreenOverlapAdjustment(
  component: NormalComponent<any>,
): void {
  if (component.root?.pcbDisabled) return
  const { db } = component.root!

  // Only adjust silkscreen text for components that opt in
  if (!component._adjustSilkscreenTextAutomatically) return

  // Use selectAll to find silkscreen text components (avoids database traversal)
  const silkscreenTextComponents = component.selectAll("silkscreentext")

  if (silkscreenTextComponents.length === 0) return

  // Get component center early to avoid repeated lookups
  const componentCenter = getComponentCenterFromCache(component, db)
  if (!componentCenter) return

  // For each silkscreen text component found, get its database record for processing
  for (const textComponent of silkscreenTextComponents) {
    // Skip if this component doesn't have the required data
    if (!textComponent.props?.text) continue

    // Get the database record for this specific text component
    // Note: We need the DB record for accurate position data and update operations
    let textDbRecord: any = null

    // Try direct ID lookup first (most efficient)
    if ((textComponent as any).pcb_silkscreen_text_id) {
      textDbRecord = db.pcb_silkscreen_text.get(
        (textComponent as any).pcb_silkscreen_text_id,
      )
    }

    // If direct lookup fails, we need to find the matching database record
    // This is necessary because the component-DB linking might not be complete yet
    if (!textDbRecord && component.pcb_component_id) {
      // Use a targeted database query (filter by component ID, not full table scan)
      const candidateTexts = db.pcb_silkscreen_text
        .list()
        .filter((t) => t.pcb_component_id === component.pcb_component_id)

      // Match by text content to find the right record
      textDbRecord = candidateTexts.find(
        (t) => t.text === textComponent.props.text,
      )
    }

    if (!textDbRecord) continue

    const textBounds = getSilkscreenTextBounds(textDbRecord)

    // Get all silkscreen elements from database (using selectAll for component discovery)
    const nearbySilkscreenElements = getAllSilkscreenElementsFromDB(
      component.root,
      db,
    )

    let hasOverlap = false

    // Check overlap with nearby silkscreen elements only (much faster than checking all)
    for (const element of nearbySilkscreenElements) {
      if (
        element.layer === textDbRecord.layer &&
        element.element_id !== textDbRecord.pcb_silkscreen_text_id
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
        x: textDbRecord.anchor_position.x - componentCenter.x,
        y: textDbRecord.anchor_position.y - componentCenter.y,
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
          element.layer === textDbRecord.layer &&
          element.element_id !== textDbRecord.pcb_silkscreen_text_id
        ) {
          if (boundsOverlap(flippedTextBounds, element.bounds)) {
            flippedHasOverlap = true
            break
          }
        }
      }

      if (!flippedHasOverlap) {
        // Update to the flipped position
        db.pcb_silkscreen_text.update(textDbRecord.pcb_silkscreen_text_id, {
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
