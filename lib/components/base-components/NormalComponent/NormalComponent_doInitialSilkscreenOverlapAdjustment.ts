import type { NormalComponent } from "./NormalComponent"

interface SilkscreenElement {
  bounds: Bounds
  layer: string
  type: "text" | "path" | "rect" | "circle"
  pcb_component_id?: string
  id: string
}

interface Bounds {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Adjust silkscreen reference designators for passive components to avoid overlaps
 * This phase runs after PCB layout is complete but before final rendering
 * Optimized to reduce database queries by using component hierarchy and spatial awareness
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

  // Collect nearby silkscreen elements using component hierarchy instead of full DB scan
  const nearbySilkscreenElements = collectNearbySilkscreenElements(
    component,
    componentCenter,
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
        element.id !== refText.pcb_silkscreen_text_id
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
      const flippedTextBounds = {
        ...textBounds,
        left: flippedPosition.x - (textBounds.right - textBounds.left) / 2,
        right: flippedPosition.x + (textBounds.right - textBounds.left) / 2,
        top: flippedPosition.y + (textBounds.top - textBounds.bottom) / 2,
        bottom: flippedPosition.y - (textBounds.top - textBounds.bottom) / 2,
      }

      let flippedHasOverlap = false

      // Check the flipped position against nearby elements only
      for (const element of nearbySilkscreenElements) {
        if (
          element.layer === refText.layer &&
          element.id !== refText.pcb_silkscreen_text_id
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
 * Collect silkscreen elements from nearby components using spatial awareness
 * This reduces the need to query the entire database
 */
function collectNearbySilkscreenElements(
  component: NormalComponent<any>,
  componentCenter: { x: number; y: number },
  db: any,
  searchRadius: number = 15,
): SilkscreenElement[] {
  const elements: SilkscreenElement[] = []

  // Strategy 1: Check siblings (components at the same level in hierarchy)
  if (component.parent) {
    for (const sibling of component.parent.children) {
      if (sibling !== component && sibling.pcb_component_id) {
        const siblingCenter = getComponentCenterFromCache(
          sibling as NormalComponent<any>,
          db,
        )
        if (
          siblingCenter &&
          isWithinRadius(componentCenter, siblingCenter, searchRadius)
        ) {
          collectSilkscreenElementsFromComponent(
            sibling.pcb_component_id,
            db,
            elements,
          )
        }
      }
    }
  }

  // Strategy 2: Check board-level components if this is a top-level component
  if (!component.parent || (component.parent as any)?.isRoot) {
    // For root level components, we need to check other root-level components
    // This is more expensive but still better than querying the entire DB
    const allComponents = db.pcb_component.list()
    for (const pcbComp of allComponents) {
      if (
        pcbComp.pcb_component_id !== component.pcb_component_id &&
        isWithinRadius(componentCenter, pcbComp.center, searchRadius)
      ) {
        collectSilkscreenElementsFromComponent(
          pcbComp.pcb_component_id,
          db,
          elements,
        )
      }
    }
  }

  return elements
}

/**
 * Collect all silkscreen elements for a specific component
 */
function collectSilkscreenElementsFromComponent(
  pcbComponentId: string,
  db: any,
  elements: SilkscreenElement[],
): void {
  // Collect silkscreen paths
  const paths = db.pcb_silkscreen_path
    .list()
    .filter((p: any) => p.pcb_component_id === pcbComponentId)
  for (const path of paths) {
    elements.push({
      bounds: getSilkscreenPathBounds(path),
      layer: path.layer,
      type: "path",
      pcb_component_id: pcbComponentId,
      id: path.pcb_silkscreen_path_id,
    })
  }

  // Collect silkscreen rects
  const rects = db.pcb_silkscreen_rect
    .list()
    .filter((r: any) => r.pcb_component_id === pcbComponentId)
  for (const rect of rects) {
    elements.push({
      bounds: getSilkscreenRectBounds(rect),
      layer: rect.layer,
      type: "rect",
      pcb_component_id: pcbComponentId,
      id: rect.pcb_silkscreen_rect_id,
    })
  }

  // Collect silkscreen circles
  const circles = db.pcb_silkscreen_circle
    .list()
    .filter((c: any) => c.pcb_component_id === pcbComponentId)
  for (const circle of circles) {
    elements.push({
      bounds: getSilkscreenCircleBounds(circle),
      layer: circle.layer,
      type: "circle",
      pcb_component_id: pcbComponentId,
      id: circle.pcb_silkscreen_circle_id,
    })
  }

  // Collect silkscreen texts
  const texts = db.pcb_silkscreen_text
    .list()
    .filter((t: any) => t.pcb_component_id === pcbComponentId)
  for (const text of texts) {
    elements.push({
      bounds: getSilkscreenTextBounds(text),
      layer: text.layer,
      type: "text",
      pcb_component_id: pcbComponentId,
      id: text.pcb_silkscreen_text_id,
    })
  }
}

/**
 * Get component center with caching to avoid repeated DB lookups
 */
function getComponentCenterFromCache(
  component: NormalComponent<any>,
  db: any,
): { x: number; y: number } | null {
  if (!component.pcb_component_id) return null

  // Use cached center if available from component's parsed props
  if (
    component._parsedProps?.pcbX !== undefined &&
    component._parsedProps?.pcbY !== undefined
  ) {
    return {
      x: component._parsedProps.pcbX,
      y: component._parsedProps.pcbY,
    }
  }

  // Fallback to DB lookup (single query per component)
  const pcbComponent = db.pcb_component.get(component.pcb_component_id)
  return pcbComponent?.center || null
}

/**
 * Check if two points are within a given radius
 */
function isWithinRadius(
  center1: { x: number; y: number },
  center2: { x: number; y: number },
  radius: number,
): boolean {
  const dx = center1.x - center2.x
  const dy = center1.y - center2.y
  return Math.sqrt(dx * dx + dy * dy) <= radius
}

/**
 * Calculate bounds for silkscreen text
 */
function getSilkscreenTextBounds(text: any) {
  const charWidth = 0.6 * text.font_size
  const textWidth = text.text.length * charWidth
  const textHeight = text.font_size

  return {
    left: text.anchor_position.x - textWidth / 2,
    right: text.anchor_position.x + textWidth / 2,
    top: text.anchor_position.y + textHeight / 2,
    bottom: text.anchor_position.y - textHeight / 2,
  }
}

/**
 * Calculate bounds for silkscreen path
 */
function getSilkscreenPathBounds(path: any) {
  if (path.route.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0 }
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
    left: minX - padding,
    right: maxX + padding,
    top: maxY + padding,
    bottom: minY - padding,
  }
}

/**
 * Calculate bounds for silkscreen rect
 */
function getSilkscreenRectBounds(rect: any) {
  return {
    left: rect.center.x - rect.width / 2,
    right: rect.center.x + rect.width / 2,
    top: rect.center.y + rect.height / 2,
    bottom: rect.center.y - rect.height / 2,
  }
}

/**
 * Calculate bounds for silkscreen circle
 */
function getSilkscreenCircleBounds(circle: any) {
  return {
    left: circle.center.x - circle.radius,
    right: circle.center.x + circle.radius,
    top: circle.center.y + circle.radius,
    bottom: circle.center.y - circle.radius,
  }
}

/**
 * Check if two bounds overlap
 */
function boundsOverlap(a: any, b: any): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom > b.top ||
    a.top < b.bottom
  )
}
