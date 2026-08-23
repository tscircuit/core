import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type { BreakoutProps } from "@tscircuit/props"
import type { PcbGroup } from "circuit-json"
import type { Breakout } from "./Breakout"

interface FanoutBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const getFanoutBounds = (pcbGroup: PcbGroup): FanoutBounds | null => {
  const outlineBounds = pcbGroup.outline
    ? getBoundsFromPoints(pcbGroup.outline)
    : null
  const width =
    pcbGroup.width ??
    (outlineBounds ? outlineBounds.maxX - outlineBounds.minX : undefined)
  const height =
    pcbGroup.height ??
    (outlineBounds ? outlineBounds.maxY - outlineBounds.minY : undefined)
  if (width === undefined || height === undefined) return null

  return {
    minX: pcbGroup.center.x - width / 2,
    maxX: pcbGroup.center.x + width / 2,
    minY: pcbGroup.center.y - height / 2,
    maxY: pcbGroup.center.y + height / 2,
  }
}

const getAxisGap = (
  firstMin: number,
  firstMax: number,
  secondMin: number,
  secondMax: number,
): number => Math.max(firstMin - secondMax, secondMin - firstMax, 0)

export const Breakout_doInitialPcbPlacementDesignRuleChecks = (
  breakout: Breakout,
): void => {
  if (breakout.root?.pcbDisabled || !breakout.pcb_group_id) return
  const root = breakout.root
  if (!root) return

  const siblingFanouts = breakout.parent?.children.filter(
    (sibling): sibling is Breakout => sibling instanceof breakout.constructor,
  )
  if (!siblingFanouts) return

  const breakoutIndex = siblingFanouts.indexOf(breakout)
  if (breakoutIndex < 0) return

  const { db } = root
  const pcbGroup = db.pcb_group.get(breakout.pcb_group_id)
  if (!pcbGroup) return
  const bounds = getFanoutBounds(pcbGroup)
  if (!bounds) return

  for (const otherFanout of siblingFanouts.slice(breakoutIndex + 1)) {
    if (!otherFanout.pcb_group_id) continue
    const otherPcbGroup = db.pcb_group.get(otherFanout.pcb_group_id)
    if (!otherPcbGroup) continue
    const otherBounds = getFanoutBounds(otherPcbGroup)
    if (!otherBounds) continue

    const breakoutMargin = (breakout._parsedProps as BreakoutProps).fanoutMargin
    const otherFanoutMargin = (otherFanout._parsedProps as BreakoutProps)
      .fanoutMargin
    const requiredMargin = Math.max(
      typeof breakoutMargin === "number" ? breakoutMargin : 0,
      typeof otherFanoutMargin === "number" ? otherFanoutMargin : 0,
    )
    const horizontalGap = getAxisGap(
      bounds.minX,
      bounds.maxX,
      otherBounds.minX,
      otherBounds.maxX,
    )
    const verticalGap = getAxisGap(
      bounds.minY,
      bounds.maxY,
      otherBounds.minY,
      otherBounds.maxY,
    )
    const horizontalOverlap =
      Math.min(bounds.maxX, otherBounds.maxX) -
      Math.max(bounds.minX, otherBounds.minX)
    const verticalOverlap =
      Math.min(bounds.maxY, otherBounds.maxY) -
      Math.max(bounds.minY, otherBounds.minY)
    const boundariesOverlap = horizontalOverlap > 0 && verticalOverlap > 0
    const violatesMargin =
      requiredMargin > 0 &&
      horizontalGap < requiredMargin &&
      verticalGap < requiredMargin
    if (!boundariesOverlap && !violatesMargin) continue

    const message = boundariesOverlap
      ? `Fanout boundaries "${breakout.name}" and "${otherFanout.name}" overlap. Fanout boundaries may not overlap.`
      : `Fanout boundaries "${breakout.name}" and "${otherFanout.name}" do not maintain the required ${requiredMargin}mm fanoutMargin.`
    const placementErrorAlreadyExists = db.pcb_placement_error
      .list()
      .some((error) => error.message === message)
    if (placementErrorAlreadyExists) continue
    db.pcb_placement_error.insert({
      error_type: "pcb_placement_error",
      message,
      subcircuit_id: breakout.subcircuit_id ?? undefined,
    })
  }
}
