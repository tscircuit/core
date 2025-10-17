import type { Group } from "./Group"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"

export function Group_doInitialPcbComponentAnchorAlignment(
  group: Group<any>,
): void {
  if (group.root?.pcbDisabled) return
  if (!group.pcb_group_id) return

  const pcbPositionAnchor = (group._parsedProps as any)?.pcbPositionAnchor
  if (!pcbPositionAnchor) return

  // Get the target position using the global position method to support nested groups
  const targetPosition = group._getGlobalPcbPositionBeforeLayout()
  const { pcbX, pcbY } = group._parsedProps as any

  // Only proceed if explicit positioning is provided
  if (pcbX === undefined && pcbY === undefined) return

  const { db } = group.root!
  const pcbGroup = db.pcb_group.get(group.pcb_group_id)
  if (!pcbGroup) return

  const { width, height, center } = pcbGroup

  if (width === 0 || height === 0) return

  // Calculate the bounds of the group
  // PCB uses Y-up coordinate system (cartesian): higher Y = top, lower Y = bottom
  const bounds = {
    left: center.x - width / 2,
    right: center.x + width / 2,
    top: center.y + height / 2, // Y-up: top is at higher Y
    bottom: center.y - height / 2, // Y-up: bottom is at lower Y
  }

  const currentCenter = { ...center }
  let anchorPos: { x: number; y: number } | null = null

  const ninePointAnchors = new Set([
    "center",
    "top_left",
    "top_center",
    "top_right",
    "center_left",
    "center_right",
    "bottom_left",
    "bottom_center",
    "bottom_right",
  ])

  if (ninePointAnchors.has(pcbPositionAnchor)) {
    switch (pcbPositionAnchor) {
      case "center":
        anchorPos = currentCenter
        break
      case "top_left":
        anchorPos = { x: bounds.left, y: bounds.top }
        break
      case "top_center":
        anchorPos = { x: currentCenter.x, y: bounds.top }
        break
      case "top_right":
        anchorPos = { x: bounds.right, y: bounds.top }
        break
      case "center_left":
        anchorPos = { x: bounds.left, y: currentCenter.y }
        break
      case "center_right":
        anchorPos = { x: bounds.right, y: currentCenter.y }
        break
      case "bottom_left":
        anchorPos = { x: bounds.left, y: bounds.bottom }
        break
      case "bottom_center":
        anchorPos = { x: currentCenter.x, y: bounds.bottom }
        break
      case "bottom_right":
        anchorPos = { x: bounds.right, y: bounds.bottom }
        break
    }
  }

  if (!anchorPos) return

  // Calculate the new center position
  // Use targetPosition (which accounts for parent positions in nested groups)
  const newCenter = { ...currentCenter }
  if (targetPosition.x !== undefined)
    newCenter.x += targetPosition.x - anchorPos.x
  if (targetPosition.y !== undefined)
    newCenter.y += targetPosition.y - anchorPos.y

  if (
    Math.abs(newCenter.x - currentCenter.x) > 1e-6 ||
    Math.abs(newCenter.y - currentCenter.y) > 1e-6
  ) {
    // Reposition the group and all its children
    group._repositionOnPcb(newCenter)

    // Update the pcb_group center in the database
    db.pcb_group.update(group.pcb_group_id, {
      center: newCenter,
    })
  }
}
