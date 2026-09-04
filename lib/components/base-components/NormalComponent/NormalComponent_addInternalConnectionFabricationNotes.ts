import type { Point } from "circuit-json"
import type { NormalComponent } from "./NormalComponent"

const INTERNAL_CONNECTION_NOTE_TEXT = "MARKED INTERNALLY CONNECTED"
const INTERNAL_CONNECTION_NOTE_FONT_SIZE = 0.12
const INTERNAL_CONNECTION_NOTE_STROKE_WIDTH = 0.05
const INTERNAL_CONNECTION_NOTE_TEXT_OFFSET = 0.12

const hasFabricationNotes = (component: NormalComponent<any, any>): boolean => {
  const { db } = component.root!
  const pcbComponentFilter = {
    pcb_component_id: component.pcb_component_id!,
  }

  return (
    db.pcb_fabrication_note_text.list(pcbComponentFilter).length > 0 ||
    db.pcb_fabrication_note_path.list(pcbComponentFilter).length > 0 ||
    db.pcb_fabrication_note_rect.list(pcbComponentFilter).length > 0 ||
    db.pcb_fabrication_note_dimension.list(pcbComponentFilter).length > 0
  )
}

/**
 * Finds a readable label placement along the longest segment of a route.
 * Route coordinates and the returned anchor are points in the board/circuit
 * world frame: +X is right, +Y is toward the top of the board, units are mm,
 * and the frame is right-handed with +Z above the board.
 */
const getLabelPlacementAlongRoute = (route: Point[]) => {
  let longestSegment = { from: route[0]!, to: route[1]!, length: -Infinity }

  for (let pointIndex = 1; pointIndex < route.length; pointIndex++) {
    const from = route[pointIndex - 1]!
    const to = route[pointIndex]!
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    if (length > longestSegment.length) {
      longestSegment = { from, to, length }
    }
  }

  const deltaX = longestSegment.to.x - longestSegment.from.x
  const deltaY = longestSegment.to.y - longestSegment.from.y
  const segmentLength = Math.max(longestSegment.length, Number.EPSILON)
  let ccwRotation = (Math.atan2(deltaY, deltaX) * 180) / Math.PI

  if (ccwRotation > 90) ccwRotation -= 180
  if (ccwRotation < -90) ccwRotation += 180

  return {
    anchorPosition: {
      x:
        (longestSegment.from.x + longestSegment.to.x) / 2 -
        (deltaY / segmentLength) * INTERNAL_CONNECTION_NOTE_TEXT_OFFSET,
      y:
        (longestSegment.from.y + longestSegment.to.y) / 2 +
        (deltaX / segmentLength) * INTERNAL_CONNECTION_NOTE_TEXT_OFFSET,
    },
    ccwRotation: ((ccwRotation % 360) + 360) % 360,
  }
}

export const NormalComponent_addInternalConnectionFabricationNotes = (
  component: NormalComponent<any, any>,
): void => {
  const root = component.root
  if (!root || root.pcbDisabled || !component.pcb_component_id) return
  if (hasFabricationNotes(component)) return

  const { db } = root
  const pcbComponent = db.pcb_component.get(component.pcb_component_id)
  if (!pcbComponent) return
  const fabricationNoteLayer = pcbComponent.layer
  if (fabricationNoteLayer !== "top" && fabricationNoteLayer !== "bottom") {
    return
  }

  const subcircuitId = component.getSubcircuit()?.subcircuit_id ?? undefined
  const pcbGroupId = component.getGroup()?.pcb_group_id ?? undefined

  for (const connectedPorts of component._getInternallyConnectedPins()) {
    const connectedPadCenters = connectedPorts.flatMap((port) => {
      if (!port?.pcb_port_id) return []
      const pcbPort = db.pcb_port.get(port.pcb_port_id)
      return pcbPort ? [{ x: pcbPort.x, y: pcbPort.y }] : []
    })
    const route = connectedPadCenters.filter(
      (point, pointIndex) =>
        connectedPadCenters.findIndex(
          (candidate) => candidate.x === point.x && candidate.y === point.y,
        ) === pointIndex,
    )

    if (route.length < 2) continue

    const { anchorPosition, ccwRotation } = getLabelPlacementAlongRoute(route)

    db.pcb_fabrication_note_path.insert({
      pcb_component_id: component.pcb_component_id,
      subcircuit_id: subcircuitId,
      layer: fabricationNoteLayer,
      route,
      stroke_width: INTERNAL_CONNECTION_NOTE_STROKE_WIDTH,
    })
    db.pcb_fabrication_note_text.insert({
      pcb_component_id: component.pcb_component_id,
      pcb_group_id: pcbGroupId,
      subcircuit_id: subcircuitId,
      font: "tscircuit2024",
      font_size: INTERNAL_CONNECTION_NOTE_FONT_SIZE,
      text: INTERNAL_CONNECTION_NOTE_TEXT,
      ccw_rotation: ccwRotation,
      layer: fabricationNoteLayer,
      anchor_position: anchorPosition,
      anchor_alignment: "center",
    })
  }
}
