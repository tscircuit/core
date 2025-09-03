import type { NormalComponent } from "./NormalComponent"
import { type Box, type Bounds, getBoundingBox } from "@tscircuit/math-utils"

// Bounds intersection detection
function doBoundsIntersect(bounds1: Bounds, bounds2: Bounds): boolean {
  return !(
    bounds1.maxX <= bounds2.minX ||
    bounds2.maxX <= bounds1.minX ||
    bounds1.maxY <= bounds2.minY ||
    bounds2.maxY <= bounds1.minY
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
  const obstacleBounds: Bounds[] = allNormalComponents.map((comp) => {
    const bounds = comp._getPcbCircuitJsonBounds()
    const box: Box = {
      center: bounds.center,
      width: bounds.width,
      height: bounds.height,
    }
    return getBoundingBox(box)
  })

  // Process each silkscreen text element
  for (const silkscreenText of silkscreenTexts) {
    const currentPosition = silkscreenText.anchor_position

    // Estimate text bounds (approximate based on font size and text length)
    const fontSize = silkscreenText.font_size
    const textWidth = silkscreenText.text.length * fontSize * 0.6 // Rough character width
    const textHeight = fontSize

    const textBox: Box = {
      center: currentPosition,
      width: textWidth,
      height: textHeight,
    }
    const textBounds: Bounds = getBoundingBox(textBox)

    // Check if current text position intersects with any obstacles
    const hasIntersection = obstacleBounds.some((obstacle) =>
      doBoundsIntersect(textBounds, obstacle),
    )

    if (!hasIntersection) {
      continue // No overlap, no adjustment needed
    }

    // Try flipping the text position across the component center
    const flippedX = 2 * componentCenter.x - currentPosition.x
    const flippedY = 2 * componentCenter.y - currentPosition.y

    const flippedTextBox: Box = {
      center: { x: flippedX, y: flippedY },
      width: textWidth,
      height: textHeight,
    }
    const flippedTextBounds: Bounds = getBoundingBox(flippedTextBox)

    // Check if flipped position resolves the intersection
    const flippedHasIntersection = obstacleBounds.some((obstacle) =>
      doBoundsIntersect(flippedTextBounds, obstacle),
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
