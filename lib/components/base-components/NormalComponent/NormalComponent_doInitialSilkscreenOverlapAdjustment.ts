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

  // Only adjust silkscreen text for components that opt in
  if (!component._adjustSilkscreenTextAutomatically) return

  // Get this component's silkscreen texts
  const componentSilkscreenTexts = db.pcb_silkscreen_text
    .list()
    .filter((text) => text.pcb_component_id === component.pcb_component_id)

  if (componentSilkscreenTexts.length === 0) return

  // Get all other silkscreen elements that could cause overlaps
  const allSilkscreenPaths = db.pcb_silkscreen_path.list()
  const allSilkscreenRects = db.pcb_silkscreen_rect.list()
  const allSilkscreenCircles = db.pcb_silkscreen_circle.list()
  const allSilkscreenTexts = db.pcb_silkscreen_text.list()

  // For each silkscreen text, check for overlaps and adjust if needed
  for (const refText of componentSilkscreenTexts) {
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
      // Only consider the opposite side initially
      const componentCenter = getComponentCenter(refText.pcb_component_id, db)
      if (!componentCenter) continue

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

      // Check the flipped position against all obstacles
      for (const path of allSilkscreenPaths) {
        if (path.layer === refText.layer) {
          const pathBounds = getSilkscreenPathBounds(path)
          if (boundsOverlap(flippedTextBounds, pathBounds)) {
            flippedHasOverlap = true
            break
          }
        }
      }

      if (!flippedHasOverlap) {
        for (const rect of allSilkscreenRects) {
          if (rect.layer === refText.layer) {
            const rectBounds = getSilkscreenRectBounds(rect)
            if (boundsOverlap(flippedTextBounds, rectBounds)) {
              flippedHasOverlap = true
              break
            }
          }
        }
      }

      if (!flippedHasOverlap) {
        for (const circle of allSilkscreenCircles) {
          if (circle.layer === refText.layer) {
            const circleBounds = getSilkscreenCircleBounds(circle)
            if (boundsOverlap(flippedTextBounds, circleBounds)) {
              flippedHasOverlap = true
              break
            }
          }
        }
      }

      if (!flippedHasOverlap) {
        for (const otherText of allSilkscreenTexts) {
          if (
            otherText.layer === refText.layer &&
            otherText.pcb_silkscreen_text_id !== refText.pcb_silkscreen_text_id
          ) {
            const otherBounds = getSilkscreenTextBounds(otherText)
            if (boundsOverlap(flippedTextBounds, otherBounds)) {
              flippedHasOverlap = true
              break
            }
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
 * Get the center position of a component from its PCB component data
 */
function getComponentCenter(
  pcbComponentId: string,
  db: any,
): { x: number; y: number } | null {
  const pcbComponent = db.pcb_component.get(pcbComponentId)
  if (!pcbComponent) return null
  return pcbComponent.center
}
