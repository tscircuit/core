import type {
  PcbSmtPad,
  PcbTraceRoutePoint,
  PcbTraceRoutePointWire,
} from "circuit-json"
import { reversePcbTraceRoute } from "../reverse-pcb-trace-route"

const EPSILON = 1e-6
const DEFAULT_MIN_PAD_CLEARANCE = 0.15

type RectPadBounds = {
  pcb_smtpad_id: string
  pcb_port_id?: string
  layer: string
  x: number
  y: number
  width: number
  height: number
  minDim: number
}

function getRectPadBounds(pad: PcbSmtPad): RectPadBounds | null {
  if (pad.shape === "rect" || pad.shape === "rotated_rect") {
    const isRotated90 =
      pad.shape === "rotated_rect" &&
      Math.abs((Math.abs(pad.ccw_rotation ?? 0) % 180) - 90) < 45
    const width = isRotated90 ? pad.height : pad.width
    const height = isRotated90 ? pad.width : pad.height
    return {
      pcb_smtpad_id: pad.pcb_smtpad_id,
      pcb_port_id: pad.pcb_port_id,
      layer: pad.layer,
      x: pad.x,
      y: pad.y,
      width,
      height,
      minDim: Math.min(width, height),
    }
  }
  return null
}

function isPointInsidePad(
  point: { x: number; y: number; layer: string },
  pad: RectPadBounds,
): boolean {
  if (point.layer !== pad.layer) return false
  return (
    Math.abs(point.x - pad.x) <= pad.width / 2 + EPSILON &&
    Math.abs(point.y - pad.y) <= pad.height / 2 + EPSILON
  )
}

function findEndpointPad(
  point: PcbTraceRoutePointWire,
  pads: RectPadBounds[],
): RectPadBounds | null {
  const portId = point.start_pcb_port_id ?? point.end_pcb_port_id
  if (portId) {
    const matchingPad = pads.find(
      (pad) => pad.pcb_port_id === portId && isPointInsidePad(point, pad),
    )
    if (matchingPad) return matchingPad
    const portPad = pads.find(
      (pad) => pad.pcb_port_id === portId && pad.layer === point.layer,
    )
    if (portPad) return portPad
  }
  return pads.find((pad) => isPointInsidePad(point, pad)) ?? null
}

function shouldNeckDownAtPad(
  pad: RectPadBounds,
  traceWidth: number,
  allPads: RectPadBounds[],
  minClearance = DEFAULT_MIN_PAD_CLEARANCE,
): boolean {
  if (pad.minDim >= traceWidth - EPSILON) return false

  // Check if any adjacent SMD pad on the same layer is close enough that a
  // full-width trace exiting this pad could violate copper clearance.
  const searchRadiusX = pad.width / 2 + traceWidth / 2 + minClearance
  const searchRadiusY = pad.height / 2 + traceWidth / 2 + minClearance

  for (const other of allPads) {
    if (other.pcb_smtpad_id === pad.pcb_smtpad_id) continue
    if (other.layer !== pad.layer) continue
    if (
      pad.pcb_port_id &&
      other.pcb_port_id &&
      pad.pcb_port_id === other.pcb_port_id
    ) {
      continue
    }

    const dx = Math.max(
      0,
      Math.abs(pad.x - other.x) - (pad.width / 2 + other.width / 2),
    )
    const dy = Math.max(
      0,
      Math.abs(pad.y - other.y) - (pad.height / 2 + other.height / 2),
    )
    const edgeGap = Math.hypot(dx, dy)
    if (
      edgeGap < traceWidth - pad.minDim + minClearance + EPSILON ||
      (Math.abs(pad.x - other.x) <= searchRadiusX + other.width / 2 &&
        Math.abs(pad.y - other.y) <= searchRadiusY + other.height / 2 &&
        edgeGap < traceWidth / 2 + minClearance + EPSILON)
    ) {
      return true
    }
  }

  return false
}

function getPadExitInterpolationFactor(
  start: { x: number; y: number },
  end: { x: number; y: number },
  pad: RectPadBounds,
): number {
  const halfW = pad.width / 2
  const halfH = pad.height / 2
  const startInside =
    Math.abs(start.x - pad.x) <= halfW + EPSILON &&
    Math.abs(start.y - pad.y) <= halfH + EPSILON
  if (!startInside) return 0

  const endInside =
    Math.abs(end.x - pad.x) <= halfW + EPSILON &&
    Math.abs(end.y - pad.y) <= halfH + EPSILON
  if (endInside) return 1

  const dx = end.x - start.x
  const dy = end.y - start.y
  let tMax = 1

  if (Math.abs(dx) > EPSILON) {
    const boundaryX = dx > 0 ? pad.x + halfW : pad.x - halfW
    const tx = (boundaryX - start.x) / dx
    if (tx >= 0 && tx < tMax) tMax = tx
  }
  if (Math.abs(dy) > EPSILON) {
    const boundaryY = dy > 0 ? pad.y + halfH : pad.y - halfH
    const ty = (boundaryY - start.y) / dy
    if (ty >= 0 && ty < tMax) tMax = ty
  }

  return Math.max(0, Math.min(1, tMax))
}

function neckDownForwardFromStart(
  route: PcbTraceRoutePoint[],
  allPads: RectPadBounds[],
): PcbTraceRoutePoint[] {
  if (route.length < 2) return route
  const firstPoint = route[0]
  if (!firstPoint || firstPoint.route_type !== "wire") return route

  const pad = findEndpointPad(firstPoint, allPads)
  if (!pad) return route

  const nominalWidth = firstPoint.width
  if (!shouldNeckDownAtPad(pad, nominalWidth, allPads)) return route

  const neckedWidth = Number(pad.minDim.toFixed(4))
  const maxEscapeDistance = nominalWidth
  let remainingEscape = maxEscapeDistance
  const result: PcbTraceRoutePoint[] = route.map((pt) => ({ ...pt }))

  for (let i = 0; i < result.length - 1; i++) {
    const curr = result[i]
    const next = result[i + 1]
    if (
      !curr ||
      !next ||
      curr.route_type !== "wire" ||
      next.route_type !== "wire"
    ) {
      break
    }
    if (curr.layer !== pad.layer || next.layer !== pad.layer) {
      break
    }

    const segLength = Math.hypot(next.x - curr.x, next.y - curr.y)
    if (segLength <= EPSILON) {
      curr.width = neckedWidth
      continue
    }

    const tExit = getPadExitInterpolationFactor(curr, next, pad)
    const outsideLength = segLength * (1 - tExit)

    if (outsideLength <= remainingEscape + EPSILON) {
      curr.width = neckedWidth
      remainingEscape = Math.max(0, remainingEscape - outsideLength)
      if (remainingEscape <= EPSILON) {
        break
      }
      continue
    }

    // Split segment at pad exit + remainingEscape
    const escapeFractionOutside = remainingEscape / segLength
    const splitT = tExit + escapeFractionOutside
    const splitPoint: PcbTraceRoutePointWire = {
      route_type: "wire",
      x: Number((curr.x + (next.x - curr.x) * splitT).toFixed(4)),
      y: Number((curr.y + (next.y - curr.y) * splitT).toFixed(4)),
      width: curr.width,
      layer: curr.layer,
    }
    curr.width = neckedWidth
    result.splice(i + 1, 0, splitPoint)
    break
  }

  return result
}

/**
 * Automatically narrows wide PCB trace segments entering fine-pitch SMD pads
 * down to `Math.min(pad.width, pad.height)` within the pad escape zone
 * (`<= traceWidth` outside the pad boundary) when adjacent SMD pads on the
 * same layer would otherwise be encroached by the wider trace.
 */
export function applyPadNeckdownToTraceRoute(
  route: PcbTraceRoutePoint[],
  pcbSmtPads: PcbSmtPad[],
): PcbTraceRoutePoint[] {
  if (route.length < 2 || pcbSmtPads.length === 0) return route

  const rectPads = pcbSmtPads
    .map(getRectPadBounds)
    .filter((pad): pad is RectPadBounds => pad !== null)
  if (rectPads.length === 0) return route

  const neckedStart = neckDownForwardFromStart(route, rectPads)
  const reversed = reversePcbTraceRoute(neckedStart)
  const neckedBothReversed = neckDownForwardFromStart(reversed, rectPads)
  return reversePcbTraceRoute(neckedBothReversed)
}
