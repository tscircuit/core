import { NormalComponent } from "./NormalComponent"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"
import { Port } from "../../primitive-components/Port"

export function NormalComponent_doInitialPcbComponentAnchorAlignment(
  component: NormalComponent<any, any>,
): void {
  if (component.root?.pcbDisabled) return
  if (!component.pcb_component_id) return

  const { pcbX, pcbY } = component._parsedProps as any
  const pcbPositionAnchor = (component.props as any)?.pcbPositionAnchor
  if (!pcbPositionAnchor) return
  if (pcbX === undefined && pcbY === undefined) return

  const bounds = getBoundsOfPcbComponents(component.children)

  if (bounds.width === 0 || bounds.height === 0) return

  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
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
    const b = {
      left: bounds.minX,
      right: bounds.maxX,
      top: bounds.minY,
      bottom: bounds.maxY,
    }
    switch (pcbPositionAnchor) {
      case "center":
        anchorPos = currentCenter
        break
      case "top_left":
        anchorPos = { x: b.left, y: b.top }
        break
      case "top_center":
        anchorPos = { x: currentCenter.x, y: b.top }
        break
      case "top_right":
        anchorPos = { x: b.right, y: b.top }
        break
      case "center_left":
        anchorPos = { x: b.left, y: currentCenter.y }
        break
      case "center_right":
        anchorPos = { x: b.right, y: currentCenter.y }
        break
      case "bottom_left":
        anchorPos = { x: b.left, y: b.bottom }
        break
      case "bottom_center":
        anchorPos = { x: currentCenter.x, y: b.bottom }
        break
      case "bottom_right":
        anchorPos = { x: b.right, y: b.bottom }
        break
    }
  } else {
    try {
      const port = (component.portMap as any)[pcbPositionAnchor as any] as
        | Port
        | undefined
      if (port) {
        anchorPos = port._getGlobalPcbPositionBeforeLayout()
      }
    } catch {
      // ignore if port not found
    }
  }

  if (!anchorPos) return

  const newCenter = { ...currentCenter }
  if (pcbX !== undefined) newCenter.x += pcbX - anchorPos.x
  if (pcbY !== undefined) newCenter.y += pcbY - anchorPos.y

  if (
    Math.abs(newCenter.x - currentCenter.x) > 1e-6 ||
    Math.abs(newCenter.y - currentCenter.y) > 1e-6
  ) {
    component._repositionOnPcb(newCenter)
  }
}
