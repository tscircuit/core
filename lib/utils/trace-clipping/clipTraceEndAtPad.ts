import type { Port } from "../../components/primitive-components/Port"
import type { SmtPad } from "../../components/primitive-components/SmtPad"
import type { PlatedHole } from "../../components/primitive-components/PlatedHole"
import { computeLineRectIntersection } from "./computeLineRectIntersection"
import { computeLineCircleIntersection } from "./computeLineCircleIntersection"

/**
 * Clips a trace endpoint to the edge of a pad when the trace width is too large
 * relative to the pad size. This prevents traces from extending past pad edges.
 *
 * When trace diameter > 1/2 pad smallest dimension:
 * 1. Compute the intersection of the trace and the pad
 * 2. Set the trace end point to the intersecting point
 *
 * @returns The clipped endpoint, or the original endpoint if no clipping needed
 */
export function clipTraceEndAtPad(params: {
  traceStart: { x: number; y: number }
  traceEnd: { x: number; y: number }
  traceWidth: number
  port: Port
}): { x: number; y: number } {
  const { traceStart, traceEnd, traceWidth, port } = params
  // Get the matched PCB primitive (pad or plated hole)
  const pcbPrimitive = port.matchedComponents.find((c) => c.isPcbPrimitive) as
    | SmtPad
    | PlatedHole
    | undefined

  if (!pcbPrimitive) {
    // No PCB primitive to clip against, return original
    return traceEnd
  }

  // Get pad bounds
  const padBounds = pcbPrimitive._getPcbCircuitJsonBounds()
  const padWidth = padBounds.width
  const padHeight = padBounds.height
  const padCenter = padBounds.center

  // Determine smallest pad dimension
  const smallestPadDimension = Math.min(padWidth, padHeight)

  // Check if clipping is needed: trace diameter > 1/2 pad smallest dimension
  if (traceWidth <= smallestPadDimension / 2) {
    // No clipping needed
    return traceEnd
  }

  // Determine pad shape and compute intersection
  let clippedPoint: { x: number; y: number } | null = null

  // Check if it's a SmtPad
  if (pcbPrimitive.componentName === "SmtPad") {
    const smtPad = pcbPrimitive as SmtPad
    const padShape = smtPad._parsedProps.shape

    if (padShape === "circle") {
      const radius = smtPad._parsedProps.radius!
      clippedPoint = computeLineCircleIntersection({
        lineStart: traceStart,
        lineEnd: traceEnd,
        circleCenter: padCenter,
        circleRadius: radius,
      })
    } else if (
      padShape === "rect" ||
      padShape === "rotated_rect" ||
      padShape === "pill" ||
      padShape === "polygon"
    ) {
      // For these shapes, use rectangular approximation based on bounds
      clippedPoint = computeLineRectIntersection({
        lineStart: traceStart,
        lineEnd: traceEnd,
        rectCenter: padCenter,
        rectWidth: padWidth,
        rectHeight: padHeight,
      })
    }
  }
  // Check if it's a PlatedHole
  else if (pcbPrimitive.componentName === "PlatedHole") {
    const platedHole = pcbPrimitive as PlatedHole
    const holeShape = platedHole._parsedProps.shape

    if (holeShape === "circle") {
      const outerDiameter = platedHole._parsedProps.outerDiameter
      clippedPoint = computeLineCircleIntersection({
        lineStart: traceStart,
        lineEnd: traceEnd,
        circleCenter: padCenter,
        circleRadius: outerDiameter / 2,
      })
    } else {
      // For other shapes (oval, pill, rect pad, etc.), use rectangular approximation
      clippedPoint = computeLineRectIntersection({
        lineStart: traceStart,
        lineEnd: traceEnd,
        rectCenter: padCenter,
        rectWidth: padWidth,
        rectHeight: padHeight,
      })
    }
  }

  // Return clipped point if found, otherwise return original
  return clippedPoint ?? traceEnd
}
