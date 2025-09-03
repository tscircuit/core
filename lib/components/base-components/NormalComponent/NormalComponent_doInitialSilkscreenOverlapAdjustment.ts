import type { NormalComponent } from "./NormalComponent"

// Simple rectangle interface for intersection detection
interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

// Simple rectangle intersection detection
function doesRectangleIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  )
}

/**
 * Automatically adjusts silkscreen reference designator text position for passives
 * (resistors, capacitors, inductors) when they overlap with other components.
 *
 * This render phase:
 * 1. Gets the current component's center and silkscreen text
 * 2. Gets all other normal components in the subcircuit as obstacles
 * 3. Determines if silkscreen text intersects any obstacle bounds
 * 4. If intersecting, tries flipping text across component center
 * 5. Commits position change if it resolves the overlap
 */
export function NormalComponent_doInitialSilkscreenOverlapAdjustment(
  component: NormalComponent<any, any>,
): void {
  // Only adjust silkscreen for components that have this feature enabled
  if (!component._adjustSilkscreenTextAutomatically) {
    return
  }

  // Skip if PCB is disabled or component has no PCB component
  if (component.root?.pcbDisabled || !component.pcb_component_id) {
    return
  }

  const { db } = component.root!

  // Get the component's center position
  const componentBounds = component._getPcbCircuitJsonBounds()
  const componentCenter = componentBounds.center

  // Find silkscreen text elements for this component
  let silkscreenTexts = db.pcb_silkscreen_text
    .list({
      pcb_component_id: component.pcb_component_id,
    })
    .filter((text) => text.text === component.name)

  if (silkscreenTexts.length === 0) {
    return
  }

  // Get all other normal components in the same subcircuit as obstacles
  const subcircuit = component.getSubcircuit()
  const allNormalComponents = subcircuit
    .selectAll("[_isNormalComponent=true]")
    .filter((comp) => comp !== component && comp.pcb_component_id)

  // Calculate obstacle bounds
  const obstacleBounds: Rectangle[] = allNormalComponents.map((comp) => {
    const bounds = comp._getPcbCircuitJsonBounds()
    return {
      x: bounds.bounds.left,
      y: Math.min(bounds.bounds.top, bounds.bounds.bottom), // Use minimum y value as origin
      width: bounds.width,
      height: bounds.height,
    }
  })

  // Process each silkscreen text element
  for (const silkscreenText of silkscreenTexts) {
    const currentPosition = silkscreenText.anchor_position

    // Estimate text bounds (approximate based on font size and text length)
    const fontSize = silkscreenText.font_size
    const textWidth = silkscreenText.text.length * fontSize * 0.6 // Rough character width
    const textHeight = fontSize

    const textBounds: Rectangle = {
      x: currentPosition.x - textWidth / 2,
      y: currentPosition.y - textHeight / 2,
      width: textWidth,
      height: textHeight,
    }

    // Check if current text position intersects with any obstacles
    const hasIntersection = obstacleBounds.some((obstacle) =>
      doesRectangleIntersect(textBounds, obstacle),
    )

    if (!hasIntersection) {
      continue // No overlap, no adjustment needed
    }

    // Try flipping the text position across the component center
    const flippedX = 2 * componentCenter.x - currentPosition.x
    const flippedY = 2 * componentCenter.y - currentPosition.y

    const flippedTextBounds: Rectangle = {
      x: flippedX - textWidth / 2,
      y: flippedY - textHeight / 2,
      width: textWidth,
      height: textHeight,
    }

    // Check if flipped position resolves the intersection
    const flippedHasIntersection = obstacleBounds.some((obstacle) =>
      doesRectangleIntersect(flippedTextBounds, obstacle),
    )

    // If flipping resolves the overlap, commit the change
    if (!flippedHasIntersection) {
      db.pcb_silkscreen_text.update(silkscreenText.pcb_silkscreen_text_id, {
        anchor_position: {
          x: flippedX,
          y: flippedY,
        },
      })
    }
    // If flipping doesn't help, leave the text in its original position
  }
}
