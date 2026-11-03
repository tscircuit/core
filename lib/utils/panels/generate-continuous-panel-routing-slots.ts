import type { PcbCutoutPolygon, Point } from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

interface OutlineEdge {
  start: Point
  end: Point
  length: number
  perimeterStart: number
}

function getPointAlongOutline(
  edges: OutlineEdge[],
  perimeterDistance: number,
): Point {
  const perimeter = edges.at(-1)!.perimeterStart + edges.at(-1)!.length
  const wrappedDistance =
    ((perimeterDistance % perimeter) + perimeter) % perimeter
  const edge =
    edges.find(
      (outlineEdge) =>
        wrappedDistance <= outlineEdge.perimeterStart + outlineEdge.length,
    ) ?? edges.at(-1)!
  const ccwRotationDegrees =
    (Math.atan2(edge.end.y - edge.start.y, edge.end.x - edge.start.x) * 180) /
    Math.PI
  return applyToPoint(
    compose(
      translate(edge.start.x, edge.start.y),
      rotateDEG(ccwRotationDegrees),
    ),
    { x: wrappedDistance - edge.perimeterStart, y: 0 },
  )
}

function getOutwardSlotBoundary(
  route: Point[],
  options: { width: number; winding: number },
): Point[] {
  const normals = route.slice(1).map((end, routeIndex) => {
    const start = route[routeIndex]!
    const length = Math.hypot(end.x - start.x, end.y - start.y)
    return {
      x: (options.winding * (end.y - start.y)) / length,
      y: (-options.winding * (end.x - start.x)) / length,
    }
  })
  return route.flatMap((position, routeIndex) => {
    const before = normals[Math.max(0, routeIndex - 1)]!
    const after = normals[Math.min(normals.length - 1, routeIndex)]!
    const denominator = 1 + before.x * after.x + before.y * after.y
    // Bevel a reversal rather than creating an unbounded miter.
    if (denominator < 1e-8) {
      return [before, after].map((normal) =>
        applyToPoint(
          translate(normal.x * options.width, normal.y * options.width),
          position,
        ),
      )
    }
    return [
      applyToPoint(
        translate(
          ((before.x + after.x) * options.width) / denominator,
          ((before.y + after.y) * options.width) / denominator,
        ),
        position,
      ),
    ]
  })
}

/** Buffer continuous outline spans, placing tabs on usable edges rather than
 * placing a new tab and rounded rectangle on every tessellated arc chord. */
export function generateContinuousPanelRoutingSlots(
  outline: Point[],
  options: {
    gapLength: number
    cutoutWidth: number
    mouseBites: boolean
    mouseBiteHoleDiameter: number
    mouseBiteHoleSpacing: number
  },
): { tabCutouts: PcbCutoutPolygon[]; mouseBiteHoles: Point[] } {
  const edges: OutlineEdge[] = []
  let perimeter = 0
  let twiceSignedArea = 0
  for (let outlineIndex = 0; outlineIndex < outline.length; outlineIndex++) {
    const start = outline[outlineIndex]!
    const end = outline[(outlineIndex + 1) % outline.length]!
    const length = Math.hypot(end.x - start.x, end.y - start.y)
    if (length < 1e-9) continue
    edges.push({ start, end, length, perimeterStart: perimeter })
    perimeter += length
    twiceSignedArea += start.x * end.y - end.x * start.y
  }
  if (edges.length < 3 || Math.abs(twiceSignedArea) < 1e-9)
    return { tabCutouts: [], mouseBiteHoles: [] }

  const requestedGapLength = options.gapLength
  let tabCenters = edges
    .filter(
      (edge) => edge.length >= requestedGapLength + 2 * options.cutoutWidth,
    )
    .map((edge) => edge.perimeterStart + edge.length / 2)
  // A wholly curved outline (e.g. a circular board) still needs bridges.
  if (tabCenters.length < 2)
    tabCenters = [0, 1, 2, 3].map(
      (quarter) => ((quarter + 0.5) * perimeter) / 4,
    )
  const gapLength = Math.min(
    requestedGapLength,
    perimeter / (2 * tabCenters.length),
  )
  const tabCutouts: PcbCutoutPolygon[] = []
  const mouseBiteHoles: Point[] = []

  for (let tabIndex = 0; tabIndex < tabCenters.length; tabIndex++) {
    const tabCenter = tabCenters[tabIndex]!
    const nextTabCenter =
      tabCenters[(tabIndex + 1) % tabCenters.length]! +
      (tabIndex === tabCenters.length - 1 ? perimeter : 0)
    const routeStart = tabCenter + gapLength / 2
    const routeEnd = nextTabCenter - gapLength / 2
    const route = [getPointAlongOutline(edges, routeStart)]
    for (const lap of [0, 1]) {
      for (const edge of edges) {
        const vertexDistance = edge.perimeterStart + lap * perimeter
        if (
          vertexDistance > routeStart + 1e-9 &&
          vertexDistance < routeEnd - 1e-9
        )
          route.push(edge.start)
      }
    }
    route.push(getPointAlongOutline(edges, routeEnd))
    const outerBoundary = getOutwardSlotBoundary(route, {
      width: options.cutoutWidth,
      winding: Math.sign(twiceSignedArea),
    })
    tabCutouts.push({
      type: "pcb_cutout",
      pcb_cutout_id: `panel_continuous_slot_${tabIndex}`,
      shape: "polygon",
      points: [...route, ...outerBoundary.reverse()],
    })

    if (
      options.mouseBites &&
      options.mouseBiteHoleDiameter > 0 &&
      gapLength >= options.mouseBiteHoleDiameter
    ) {
      const pitch = options.mouseBiteHoleDiameter + options.mouseBiteHoleSpacing
      const holeCount =
        Math.floor((gapLength - options.mouseBiteHoleDiameter) / pitch) + 1
      for (let holeIndex = 0; holeIndex < holeCount; holeIndex++) {
        const offset = (holeIndex - (holeCount - 1) / 2) * pitch
        mouseBiteHoles.push(getPointAlongOutline(edges, tabCenter + offset))
      }
    }
  }
  return { tabCutouts, mouseBiteHoles }
}
