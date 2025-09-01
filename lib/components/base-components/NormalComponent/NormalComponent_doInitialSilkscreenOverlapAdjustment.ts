import type { NormalComponent } from "./NormalComponent"

/**
 * Adjust silkscreen reference designators for passive components to avoid overlaps
 * This phase runs after PCB layout is complete but before final rendering
 */
export function NormalComponent_doInitialSilkscreenOverlapAdjustment(
  component: NormalComponent<any>,
): void {
  if (component.root?.pcbDisabled) return
  const { db } = component.root!

  // Only process if this is a subcircuit or board
  if (!component.isSubcircuit && component.componentName !== "Board") return

  // Get all silkscreen texts in this component and its children that are reference designators for passives
  const allSilkscreenTexts = db.pcb_silkscreen_text.list()
  const passiveReferenceTexts = allSilkscreenTexts.filter((text) => {
    // Check if this is a passive component reference designator
    return /^(R\d+|C\d+|L\d+)$/i.test(text.text)
  })

  if (passiveReferenceTexts.length === 0) return

  // Get all other silkscreen elements that could cause overlaps
  const allSilkscreenPaths = db.pcb_silkscreen_path.list()
  const allSilkscreenRects = db.pcb_silkscreen_rect.list()
  const allSilkscreenCircles = db.pcb_silkscreen_circle.list()

  // For each passive reference designator, check for overlaps and adjust if needed
  for (const refText of passiveReferenceTexts) {
    const textBounds = getSilkscreenTextBounds(refText)
    let hasOverlap = false

    // Check overlap with other silkscreen elements on the same layer
    for (const path of allSilkscreenPaths) {
      if (path.layer === refText.layer) {
        const pathBounds = getSilkscreenPathBounds(path)
        if (boundsOverlap(textBounds, pathBounds)) {
          hasOverlap = true
          break
        }
      }
    }

    if (!hasOverlap) {
      for (const rect of allSilkscreenRects) {
        if (rect.layer === refText.layer) {
          const rectBounds = getSilkscreenRectBounds(rect)
          if (boundsOverlap(textBounds, rectBounds)) {
            hasOverlap = true
            break
          }
        }
      }
    }

    if (!hasOverlap) {
      for (const circle of allSilkscreenCircles) {
        if (circle.layer === refText.layer) {
          const circleBounds = getSilkscreenCircleBounds(circle)
          if (boundsOverlap(textBounds, circleBounds)) {
            hasOverlap = true
            break
          }
        }
      }
    }

    if (!hasOverlap) {
      // Check overlap with other text elements
      for (const otherText of allSilkscreenTexts) {
        if (
          otherText.layer === refText.layer &&
          otherText.pcb_silkscreen_text_id !== refText.pcb_silkscreen_text_id
        ) {
          const otherBounds = getSilkscreenTextBounds(otherText)
          if (boundsOverlap(textBounds, otherBounds)) {
            hasOverlap = true
            break
          }
        }
      }
    }

    if (hasOverlap) {
      // Find a better position for the text
      const newPosition = findBestTextPosition(
        refText,
        textBounds,
        [
          ...allSilkscreenPaths.filter((p) => p.layer === refText.layer),
          ...allSilkscreenRects.filter((r) => r.layer === refText.layer),
          ...allSilkscreenCircles.filter((c) => c.layer === refText.layer),
          ...allSilkscreenTexts.filter(
            (t) =>
              t.layer === refText.layer &&
              t.pcb_silkscreen_text_id !== refText.pcb_silkscreen_text_id,
          ),
        ],
        db,
      )

      // Update the text position
      db.pcb_silkscreen_text.update(refText.pcb_silkscreen_text_id, {
        anchor_position: newPosition,
      })
    }
  }
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

/**
 * Find the best position for a reference designator text that avoids overlaps
 */
function findBestTextPosition(
  refText: any,
  textBounds: any,
  obstacles: any[],
  db: any,
): { x: number; y: number } {
  const textWidth = textBounds.right - textBounds.left
  const textHeight = textBounds.top - textBounds.bottom
  const margin = 0.5 // minimum margin around text

  // Get the component's own silkscreen elements to position relative to them
  const componentSilkscreenElements = getComponentSilkscreenElements(
    refText.pcb_component_id,
    db,
  )
  const componentBounds = getComponentSilkscreenBounds(
    componentSilkscreenElements,
  )

  // Try positions around the original location
  const originalX = refText.anchor_position.x
  const originalY = refText.anchor_position.y

  // If we have component bounds, prioritize positions relative to the component outline
  let attempts: { x: number; y: number; priority: number }[] = []

  if (componentBounds) {
    const clearance = 0.8 // Distance from component edge

    // High priority: positions below and above the component center
    attempts.push(
      {
        x: componentBounds.centerX,
        y: componentBounds.bottom - clearance - textHeight / 2,
        priority: 1,
      }, // Below center
      {
        x: componentBounds.centerX,
        y: componentBounds.top + clearance + textHeight / 2,
        priority: 2,
      }, // Above center
      {
        x: componentBounds.left - clearance - textWidth / 2,
        y: componentBounds.centerY,
        priority: 3,
      }, // Left center
      {
        x: componentBounds.right + clearance + textWidth / 2,
        y: componentBounds.centerY,
        priority: 4,
      }, // Right center
    )

    // Medium priority: corner positions
    attempts.push(
      {
        x: componentBounds.centerX - textWidth / 2,
        y: componentBounds.bottom - clearance - textHeight / 2,
        priority: 5,
      },
      {
        x: componentBounds.centerX + textWidth / 2,
        y: componentBounds.bottom - clearance - textHeight / 2,
        priority: 6,
      },
      {
        x: componentBounds.centerX - textWidth / 2,
        y: componentBounds.top + clearance + textHeight / 2,
        priority: 7,
      },
      {
        x: componentBounds.centerX + textWidth / 2,
        y: componentBounds.top + clearance + textHeight / 2,
        priority: 8,
      },
    )
  }

  // Fallback positions around original location (lower priority)
  attempts.push(
    { x: originalX, y: originalY - 2.0, priority: 10 }, // Below original
    { x: originalX, y: originalY + 2.0, priority: 11 }, // Above original
    { x: originalX - 2.5, y: originalY, priority: 12 }, // Left of original
    { x: originalX + 2.5, y: originalY, priority: 13 }, // Right of original
    { x: originalX - 1.5, y: originalY - 2.0, priority: 14 },
    { x: originalX + 1.5, y: originalY - 2.0, priority: 15 },
    { x: originalX - 1.5, y: originalY + 2.0, priority: 16 },
    { x: originalX + 1.5, y: originalY + 2.0, priority: 17 },
  )

  // Sort by priority (lower numbers = higher priority)
  attempts.sort((a, b) => a.priority - b.priority)

  for (const position of attempts) {
    // Create test bounds for this position
    const testBounds = {
      left: position.x - textWidth / 2 - margin,
      right: position.x + textWidth / 2 + margin,
      top: position.y + textHeight / 2 + margin,
      bottom: position.y - textHeight / 2 - margin,
    }

    // Check if this position overlaps with any obstacles
    let hasOverlap = false
    for (const obstacle of obstacles) {
      const obstacleBounds = getObstacleBounds(obstacle)
      if (boundsOverlap(testBounds, obstacleBounds)) {
        hasOverlap = true
        break
      }
    }

    if (!hasOverlap) {
      return { x: position.x, y: position.y }
    }
  }

  // If no position found, return the original position (fallback)
  return { x: originalX, y: originalY }
}

/**
 * Get all silkscreen elements that belong to the same component as the reference text
 */
function getComponentSilkscreenElements(pcbComponentId: string, db: any) {
  const elements: any[] = []

  // Get silkscreen paths for this component
  for (const path of db.pcb_silkscreen_path.list()) {
    if (path.pcb_component_id === pcbComponentId) {
      elements.push({ ...path, type: "pcb_silkscreen_path" })
    }
  }

  // Get silkscreen rects for this component
  for (const rect of db.pcb_silkscreen_rect.list()) {
    if (rect.pcb_component_id === pcbComponentId) {
      elements.push({ ...rect, type: "pcb_silkscreen_rect" })
    }
  }

  // Get silkscreen circles for this component
  for (const circle of db.pcb_silkscreen_circle.list()) {
    if (circle.pcb_component_id === pcbComponentId) {
      elements.push({ ...circle, type: "pcb_silkscreen_circle" })
    }
  }

  return elements
}

/**
 * Calculate the overall bounds of a component's silkscreen elements
 */
function getComponentSilkscreenBounds(elements: any[]): {
  left: number
  right: number
  top: number
  bottom: number
  centerX: number
  centerY: number
} | null {
  if (elements.length === 0) return null

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const element of elements) {
    const bounds = getObstacleBounds(element)
    minX = Math.min(minX, bounds.left)
    maxX = Math.max(maxX, bounds.right)
    minY = Math.min(minY, bounds.bottom)
    maxY = Math.max(maxY, bounds.top)
  }

  return {
    left: minX,
    right: maxX,
    top: maxY,
    bottom: minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}

/**
 * Get bounds for any type of silkscreen obstacle
 */
function getObstacleBounds(obstacle: any) {
  if (obstacle.type === "pcb_silkscreen_path") {
    return getSilkscreenPathBounds(obstacle)
  } else if (obstacle.type === "pcb_silkscreen_rect") {
    return getSilkscreenRectBounds(obstacle)
  } else if (obstacle.type === "pcb_silkscreen_circle") {
    return getSilkscreenCircleBounds(obstacle)
  } else if (obstacle.type === "pcb_silkscreen_text") {
    return getSilkscreenTextBounds(obstacle)
  }
  return { left: 0, right: 0, top: 0, bottom: 0 }
}
