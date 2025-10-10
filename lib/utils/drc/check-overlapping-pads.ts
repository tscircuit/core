import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  PcbSmtPad,
  PcbSmtPadCircle,
  PcbSmtPadRect,
  PcbSmtPadPolygon,
  PcbSmtPadPill,
  PcbSmtPadRotatedRect,
  PcbSmtPadRotatedPill,
} from "circuit-json"
import { nanoid } from "nanoid"

export interface OverlappingPadError {
  type: "overlapping_pad_error"
  pcb_overlapping_pad_error_id: string
  message: string
  pad_ids: string[]
  center?: { x: number; y: number }
  pcb_component_ids: string[]
  pcb_port_ids: string[]
}

/**
 * Checks for overlapping SMT pads in the circuit
 * Pads with the same subcircuit_id are considered part of the same connectivity
 * and are allowed to overlap
 */
export function checkOverlappingPads(
  circuitJson: any[] | CircuitJsonUtilObjects,
): OverlappingPadError[] {
  const db = Array.isArray(circuitJson)
    ? {
        pcb_smtpad: {
          list: () => circuitJson.filter((el) => el.type === "pcb_smtpad"),
        },
      }
    : circuitJson

  const pads = db.pcb_smtpad.list() as PcbSmtPad[]
  const errors: OverlappingPadError[] = []

  for (let i = 0; i < pads.length; i++) {
    for (let j = i + 1; j < pads.length; j++) {
      const pad1 = pads[i]
      const pad2 = pads[j]

      // Skip if pads are on different layers
      if (pad1.layer !== pad2.layer) continue

      // Skip if pads have the same subcircuit_id (same connectivity)
      if (
        pad1.subcircuit_id &&
        pad2.subcircuit_id &&
        pad1.subcircuit_id === pad2.subcircuit_id
      )
        continue

      // Check if pads overlap
      if (isOverlapping(pad1, pad2)) {
        const center = getOverlapCenter(pad1, pad2)
        const pcb_component_ids = [
          pad1.pcb_component_id,
          pad2.pcb_component_id,
        ].filter(Boolean) as string[]

        const pcb_port_ids = [pad1.pcb_port_id, pad2.pcb_port_id].filter(
          Boolean,
        ) as string[]

        errors.push({
          type: "overlapping_pad_error",
          pcb_overlapping_pad_error_id: `overlap_${pad1.pcb_smtpad_id}_${pad2.pcb_smtpad_id}`,
          message: `SMT pads ${pad1.pcb_smtpad_id} and ${pad2.pcb_smtpad_id} are overlapping.`,
          pad_ids: [pad1.pcb_smtpad_id, pad2.pcb_smtpad_id],
          center,
          pcb_component_ids,
          pcb_port_ids,
        })
      }
    }
  }

  return errors
}

/**
 * Checks if two SMT pads overlap geometrically
 */
function isOverlapping(pad1: PcbSmtPad, pad2: PcbSmtPad): boolean {
  if (pad1.shape === "circle" && pad2.shape === "circle") {
    return isCircleOverlapping(pad1, pad2)
  } else if (pad1.shape === "rect" && pad2.shape === "rect") {
    return isRectOverlapping(pad1, pad2)
  } else if (pad1.shape === "circle" && pad2.shape === "rect") {
    return isCircleRectOverlapping(pad1, pad2)
  } else if (pad1.shape === "rect" && pad2.shape === "circle") {
    return isCircleRectOverlapping(pad2, pad1)
  }

  // For other shapes (polygon, pill, etc.), use bounding box approximation
  return isBoundingBoxOverlapping(pad1, pad2)
}

/**
 * Checks if two circular pads overlap
 */
function isCircleOverlapping(
  pad1: PcbSmtPad & { shape: "circle" },
  pad2: PcbSmtPad & { shape: "circle" },
): boolean {
  const dx = pad1.x - pad2.x
  const dy = pad1.y - pad2.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const minDistance = pad1.radius + pad2.radius
  return distance < minDistance
}

/**
 * Checks if two rectangular pads overlap
 */
function isRectOverlapping(
  pad1: PcbSmtPad & { shape: "rect" },
  pad2: PcbSmtPad & { shape: "rect" },
): boolean {
  const pad1Left = pad1.x - pad1.width / 2
  const pad1Right = pad1.x + pad1.width / 2
  const pad1Top = pad1.y - pad1.height / 2
  const pad1Bottom = pad1.y + pad1.height / 2

  const pad2Left = pad2.x - pad2.width / 2
  const pad2Right = pad2.x + pad2.width / 2
  const pad2Top = pad2.y - pad2.height / 2
  const pad2Bottom = pad2.y + pad2.height / 2

  return !(
    pad1Right < pad2Left ||
    pad1Left > pad2Right ||
    pad1Bottom < pad2Top ||
    pad1Top > pad2Bottom
  )
}

/**
 * Checks if a circular pad overlaps with a rectangular pad
 */
function isCircleRectOverlapping(
  circlePad: PcbSmtPad & { shape: "circle" },
  rectPad: PcbSmtPad & { shape: "rect" },
): boolean {
  const rectLeft = rectPad.x - rectPad.width / 2
  const rectRight = rectPad.x + rectPad.width / 2
  const rectTop = rectPad.y - rectPad.height / 2
  const rectBottom = rectPad.y + rectPad.height / 2

  // Find the closest point on the rectangle to the circle center
  const closestX = Math.max(rectLeft, Math.min(circlePad.x, rectRight))
  const closestY = Math.max(rectTop, Math.min(circlePad.y, rectBottom))

  // Calculate distance from circle center to closest point on rectangle
  const dx = circlePad.x - closestX
  const dy = circlePad.y - closestY
  const distance = Math.sqrt(dx * dx + dy * dy)

  return distance < circlePad.radius
}

/**
 * Fallback method using bounding boxes for complex shapes
 */
function isBoundingBoxOverlapping(pad1: PcbSmtPad, pad2: PcbSmtPad): boolean {
  const box1 = getBoundingBox(pad1)
  const box2 = getBoundingBox(pad2)

  return !(
    box1.right < box2.left ||
    box1.left > box2.right ||
    box1.bottom < box2.top ||
    box1.top > box2.bottom
  )
}

/**
 * Gets the bounding box for any pad shape
 */
function getBoundingBox(pad: PcbSmtPad): {
  left: number
  right: number
  top: number
  bottom: number
} {
  if (pad.shape === "circle") {
    const circlePad = pad as PcbSmtPadCircle
    const radius = circlePad.radius
    return {
      left: circlePad.x - radius,
      right: circlePad.x + radius,
      top: circlePad.y - radius,
      bottom: circlePad.y + radius,
    }
  } else if (pad.shape === "rect") {
    const rectPad = pad as PcbSmtPadRect
    return {
      left: rectPad.x - rectPad.width / 2,
      right: rectPad.x + rectPad.width / 2,
      top: rectPad.y - rectPad.height / 2,
      bottom: rectPad.y + rectPad.height / 2,
    }
  } else if (pad.shape === "pill") {
    const pillPad = pad as PcbSmtPadPill
    return {
      left: pillPad.x - pillPad.width / 2,
      right: pillPad.x + pillPad.width / 2,
      top: pillPad.y - pillPad.height / 2,
      bottom: pillPad.y + pillPad.height / 2,
    }
  } else if (pad.shape === "rotated_rect") {
    const rotatedRectPad = pad as PcbSmtPadRotatedRect
    return {
      left: rotatedRectPad.x - rotatedRectPad.width / 2,
      right: rotatedRectPad.x + rotatedRectPad.width / 2,
      top: rotatedRectPad.y - rotatedRectPad.height / 2,
      bottom: rotatedRectPad.y + rotatedRectPad.height / 2,
    }
  } else if (pad.shape === "rotated_pill") {
    const rotatedPillPad = pad as PcbSmtPadRotatedPill
    return {
      left: rotatedPillPad.x - rotatedPillPad.width / 2,
      right: rotatedPillPad.x + rotatedPillPad.width / 2,
      top: rotatedPillPad.y - rotatedPillPad.height / 2,
      bottom: rotatedPillPad.y + rotatedPillPad.height / 2,
    }
  } else if (pad.shape === "polygon") {
    const polygonPad = pad as PcbSmtPadPolygon
    // For polygon, calculate bounding box from all points
    const xs = polygonPad.points.map((p) => p.x)
    const ys = polygonPad.points.map((p) => p.y)
    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    }
  } else {
    // For unknown shapes, use a conservative bounding box
    // This is a fallback and may not be perfectly accurate
    const size = 1.0 // Default size assumption
    const x = (pad as any).x ?? 0
    const y = (pad as any).y ?? 0
    return {
      left: x - size / 2,
      right: x + size / 2,
      top: y - size / 2,
      bottom: y + size / 2,
    }
  }
}

/**
 * Calculates the center point of the overlap between two pads
 */
function getOverlapCenter(
  pad1: PcbSmtPad,
  pad2: PcbSmtPad,
): { x: number; y: number } {
  const getCenter = (pad: PcbSmtPad): { x: number; y: number } => {
    if (pad.shape === "circle") {
      const circlePad = pad as PcbSmtPadCircle
      return { x: circlePad.x, y: circlePad.y }
    } else if (pad.shape === "rect") {
      const rectPad = pad as PcbSmtPadRect
      return { x: rectPad.x, y: rectPad.y }
    } else if (pad.shape === "pill") {
      const pillPad = pad as PcbSmtPadPill
      return { x: pillPad.x, y: pillPad.y }
    } else if (pad.shape === "rotated_rect") {
      const rotatedRectPad = pad as PcbSmtPadRotatedRect
      return { x: rotatedRectPad.x, y: rotatedRectPad.y }
    } else if (pad.shape === "rotated_pill") {
      const rotatedPillPad = pad as PcbSmtPadRotatedPill
      return { x: rotatedPillPad.x, y: rotatedPillPad.y }
    } else if (pad.shape === "polygon") {
      const polygonPad = pad as PcbSmtPadPolygon
      // Calculate centroid of polygon
      const xs = polygonPad.points.map((p) => p.x)
      const ys = polygonPad.points.map((p) => p.y)
      return {
        x: xs.reduce((sum, x) => sum + x, 0) / xs.length,
        y: ys.reduce((sum, y) => sum + y, 0) / ys.length,
      }
    } else {
      return { x: 0, y: 0 }
    }
  }

  const center1 = getCenter(pad1)
  const center2 = getCenter(pad2)

  return {
    x: (center1.x + center2.x) / 2,
    y: (center1.y + center2.y) / 2,
  }
}
