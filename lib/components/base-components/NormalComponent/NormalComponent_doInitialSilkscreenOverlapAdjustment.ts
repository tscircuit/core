import { getBoardBounds } from "@tscircuit/circuit-json-util"
import {
  type Bounds,
  type Box,
  doBoundsOverlap,
  getBoundingBox,
} from "@tscircuit/math-utils"
import type { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import type { NormalComponent } from "./NormalComponent"
import { getPcbTextBounds } from "./utils/getPcbTextBounds"

const isInsideBounds = (inner: Bounds, outer: Bounds): boolean =>
  inner.minX >= outer.minX &&
  inner.maxX <= outer.maxX &&
  inner.minY >= outer.minY &&
  inner.maxY <= outer.maxY

const doTextBoundsOverlapSignificantly = (
  a: Bounds,
  b: Bounds,
  minOverlap = 0.15,
): boolean => {
  const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
  const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
  return overlapX > minOverlap && overlapY > minOverlap
}

/**
 * Automatically adjusts silkscreen reference designator text position when it
 * overlaps with other components, other silkscreen labels, or extends outside
 * the board outline.
 *
 * Respects manual `pcbSx` silkscreen text positioning and `pcbStyle.silkscreenTextPosition`.
 */
export function NormalComponent_doInitialSilkscreenOverlapAdjustment(
  component: NormalComponent<any, any>,
): void {
  const inheritedPcbStyle = component.getInheritedProperty("pcbStyle")
  const silkscreenTextPosition = inheritedPcbStyle?.silkscreenTextPosition

  if (
    silkscreenTextPosition === "centered" ||
    silkscreenTextPosition === "none" ||
    (typeof silkscreenTextPosition === "object" &&
      silkscreenTextPosition !== null)
  ) {
    return
  }

  const isExplicitOutsideMode = silkscreenTextPosition === "outside"

  // Only adjust silkscreen for components that have this feature enabled
  // or when pcbStyle.silkscreenTextPosition === "outside" is set
  if (!component._adjustSilkscreenTextAutomatically && !isExplicitOutsideMode) {
    return
  }

  // Skip if PCB is disabled or component has no PCB component
  if (component.root?.pcbDisabled || !component.pcb_component_id) {
    return
  }

  const { db } = component.root!

  // Get the component's center position and own bounds
  const componentBounds = component._getPcbCircuitJsonBounds()
  const componentCenter = componentBounds.center
  const ownComponentBounds: Bounds = getBoundingBox({
    center: componentBounds.center,
    width: componentBounds.width,
    height: componentBounds.height,
  })

  // Find silkscreen text elements for this component
  const silkscreenTexts = db.pcb_silkscreen_text
    .list({
      pcb_component_id: component.pcb_component_id,
    })
    .filter((text) => text.text === component.name)

  if (silkscreenTexts.length === 0) {
    return
  }

  const silkscreenPrimitives = component.selectAll(
    "silkscreentext",
  ) as SilkscreenText[]

  // Get all other normal components in the same subcircuit as obstacles
  const subcircuit = component.getSubcircuit()
  const allNormalComponents = subcircuit
    .selectAll("[_isNormalComponent=true]")
    .filter((comp) => comp !== component && comp.pcb_component_id)

  // Calculate component obstacle bounds
  const obstacleBounds: Bounds[] = allNormalComponents.map((comp) => {
    const bounds = comp._getPcbCircuitJsonBounds()
    const box: Box = {
      center: bounds.center,
      width: bounds.width,
      height: bounds.height,
    }
    return getBoundingBox(box)
  })

  const boards = db.pcb_board.list()
  const board = boards.length === 1 ? boards[0] : undefined
  const rawBoardBounds =
    board &&
    (board.width ?? 0) > 0 &&
    (board.height ?? 0) > 0 &&
    (!board.outline || board.outline.length === 0)
      ? getBoardBounds(board)
      : undefined
  // Only enforce board bounds in explicit outside mode when the component itself lies inside the board
  const boardBounds =
    isExplicitOutsideMode &&
    rawBoardBounds &&
    isInsideBounds(ownComponentBounds, rawBoardBounds)
      ? rawBoardBounds
      : undefined

  // Process each silkscreen text element
  for (const silkscreenText of silkscreenTexts) {
    // Never move labels placed explicitly via pcbSx or pcbStyle.silkscreenTextPosition
    const matchingPrimitive = silkscreenPrimitives.find((prim) =>
      prim.pcb_silkscreen_text_ids.includes(
        silkscreenText.pcb_silkscreen_text_id,
      ),
    )
    if (matchingPrimitive?._hasExplicitPcbPosition) {
      continue
    }

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

    const otherTextBounds: Bounds[] = db.pcb_silkscreen_text
      .list()
      .filter(
        (other) =>
          other.pcb_silkscreen_text_id !==
            silkscreenText.pcb_silkscreen_text_id &&
          other.pcb_component_id !== silkscreenText.pcb_component_id &&
          other.layer === silkscreenText.layer &&
          (!silkscreenText.subcircuit_id ||
            other.subcircuit_id === silkscreenText.subcircuit_id),
      )
      .map((other) => {
        const b = getPcbTextBounds(other)
        return {
          minX: b.x,
          minY: b.y,
          maxX: b.x + b.width,
          maxY: b.y + b.height,
        }
      })

    const hasComponentOverlap = (candidateBounds: Bounds): boolean =>
      obstacleBounds.some((obstacle) =>
        doBoundsOverlap(candidateBounds, obstacle),
      )

    const isPositionClearStrict = (candidateBounds: Bounds): boolean => {
      if (boardBounds && !isInsideBounds(candidateBounds, boardBounds)) {
        return false
      }
      if (hasComponentOverlap(candidateBounds)) {
        return false
      }
      if (
        otherTextBounds.some((other) =>
          doTextBoundsOverlapSignificantly(candidateBounds, other),
        )
      ) {
        return false
      }
      return true
    }

    const currentNeedsAdjustment = isExplicitOutsideMode
      ? !isPositionClearStrict(textBoundsBox)
      : hasComponentOverlap(textBoundsBox)

    if (!currentNeedsAdjustment) {
      continue
    }

    // Candidate 1: flip across component center (preserves legacy passive flip preference)
    const flippedX = 2 * componentCenter.x - currentPosition.x
    const flippedY = 2 * componentCenter.y - currentPosition.y

    const flippedTextBounds: Bounds = getBoundingBox({
      center: { x: flippedX, y: flippedY },
      width: textBounds.width,
      height: textBounds.height,
    })

    const flippedIsClear = isExplicitOutsideMode
      ? isPositionClearStrict(flippedTextBounds)
      : !hasComponentOverlap(flippedTextBounds)

    if (flippedIsClear) {
      db.pcb_silkscreen_text.update(silkscreenText.pcb_silkscreen_text_id, {
        anchor_position: {
          x: flippedX,
          y: flippedY,
        },
      })
      continue
    }

    if (!isExplicitOutsideMode) {
      continue
    }

    const clearanceX = Math.max(
      0.2,
      Math.min(
        0.8,
        Math.abs(currentPosition.x - componentCenter.x) -
          componentBounds.width / 2 -
          textBounds.width / 2,
      ),
    )
    const clearanceY = Math.max(
      0.2,
      Math.min(
        0.8,
        Math.abs(currentPosition.y - componentCenter.y) -
          componentBounds.height / 2 -
          textBounds.height / 2,
      ),
    )
    const clearance = Math.max(clearanceX, clearanceY, 0.25)

    const offsetX = componentBounds.width / 2 + clearance + textBounds.width / 2
    const offsetY =
      componentBounds.height / 2 + clearance + textBounds.height / 2

    const fallbackCandidates: Array<{ x: number; y: number }> = [
      { x: componentCenter.x, y: componentCenter.y + offsetY },
      { x: componentCenter.x, y: componentCenter.y - offsetY },
      { x: componentCenter.x + offsetX, y: componentCenter.y },
      { x: componentCenter.x - offsetX, y: componentCenter.y },
      { x: componentCenter.x + offsetX, y: componentCenter.y + offsetY },
      { x: componentCenter.x - offsetX, y: componentCenter.y + offsetY },
      { x: componentCenter.x + offsetX, y: componentCenter.y - offsetY },
      { x: componentCenter.x - offsetX, y: componentCenter.y - offsetY },
    ]

    for (const candidate of fallbackCandidates) {
      const candidateTextBounds = getPcbTextBounds({
        ...silkscreenText,
        anchor_position: candidate,
      })
      const candidateBounds: Bounds = {
        minX: candidateTextBounds.x,
        minY: candidateTextBounds.y,
        maxX: candidateTextBounds.x + candidateTextBounds.width,
        maxY: candidateTextBounds.y + candidateTextBounds.height,
      }
      if (
        !doBoundsOverlap(candidateBounds, ownComponentBounds) &&
        isPositionClearStrict(candidateBounds)
      ) {
        db.pcb_silkscreen_text.update(silkscreenText.pcb_silkscreen_text_id, {
          anchor_position: {
            x: candidate.x,
            y: candidate.y,
          },
        })
        break
      }
    }
  }
}
