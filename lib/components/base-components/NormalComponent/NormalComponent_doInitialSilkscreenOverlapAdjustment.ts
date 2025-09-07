import type { NormalComponent } from "./NormalComponent"
import { getPcbTextBounds } from "./utils/getPcbTextBounds"
import {
  type Box,
  type Bounds,
  getBoundingBox,
  doBoundsOverlap,
} from "@tscircuit/math-utils"

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

    // Get accurate text bounds based on anchor alignment
    const textBounds = getPcbTextBounds(silkscreenText)

    const textBox: Box = {
      center: {
        x: textBounds.x + textBounds.width / 2,
        y: textBounds.y + textBounds.height / 2,
      },
      width: textBounds.width,
      height: textBounds.height,
    }
    const textBoundsBox: Bounds = getBoundingBox(textBox)

    // Check if current text position intersects with any obstacles
    const hasOverlap = obstacleBounds.some((obstacle) =>
      doBoundsOverlap(textBoundsBox, obstacle),
    )

    if (!hasOverlap) {
      continue // No overlap, no adjustment needed
    }

    // Try flipping the text position across the component center
    const flippedX = 2 * componentCenter.x - currentPosition.x
    const flippedY = 2 * componentCenter.y - currentPosition.y

    const flippedTextBox: Box = {
      center: { x: flippedX, y: flippedY },
      width: textBounds.width,
      height: textBounds.height,
    }
    const flippedTextBounds: Bounds = getBoundingBox(flippedTextBox)

    // Check if flipped position resolves the intersection
    const flippedHasOverlap = obstacleBounds.some((obstacle) =>
      doBoundsOverlap(flippedTextBounds, obstacle),
    )

    // If flipping resolves the overlap, commit the change
    if (!flippedHasOverlap) {
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
