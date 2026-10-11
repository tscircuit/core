import Flatten from "@flatten-js/core"
import type { PcbCopperPour, PointWithBulge } from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type { Obstacle } from "./types"

const MAX_BAND_HEIGHT = 0.1

type BoundarySpan = {
  minY: number
  maxY: number
  xAtY: (y: number) => number
}

const getBoundarySpans = (
  vertices: readonly PointWithBulge[],
): BoundarySpan[] =>
  vertices.flatMap((start, index) => {
    const end = vertices[(index + 1) % vertices.length]
    if (start.x === end.x && start.y === end.y) return []
    if (!start.bulge) {
      if (start.y === end.y) return []
      return [
        {
          minY: Math.min(start.y, end.y),
          maxY: Math.max(start.y, end.y),
          xAtY: (y: number) =>
            y === start.y
              ? start.x
              : y === end.y
                ? end.x
                : start.x +
                  ((y - start.y) / (end.y - start.y)) * (end.x - start.x),
        },
      ]
    }

    // Circuit JSON bulge = tan(signed sweep / 4). This is the same center
    // construction used by circuit-to-svg's copper-pour boundary clipping.
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const chordLength = Math.hypot(deltaX, deltaY)
    const centerOffset =
      (chordLength * (1 - start.bulge ** 2)) / (4 * start.bulge)
    const center = new Flatten.Point(
      (start.x + end.x) / 2 - (deltaY / chordLength) * centerOffset,
      (start.y + end.y) / 2 + (deltaX / chordLength) * centerOffset,
    )
    const radius = Math.hypot(start.x - center.x, start.y - center.y)
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x)
    const arc = new Flatten.Arc(
      center,
      radius,
      startAngle,
      startAngle + 4 * Math.atan(start.bulge),
      start.bulge > 0,
    )
    // Flatten splits at cardinal points, so each span is monotone in X and Y.
    // No Boolean operations or chord approximation can erase curved copper.
    const functionalSpans = arc.breakToFunctional()
    const cardinalPoint = (angle: number) => {
      const quadrant = ((Math.round(angle / (Math.PI / 2)) % 4) + 4) % 4
      return {
        x: center.x + [radius, 0, -radius, 0][quadrant],
        y: center.y + [0, radius, 0, -radius][quadrant],
      }
    }
    return functionalSpans.flatMap((span, spanIndex) => {
      // Preserve the input's exact shared vertices. Trigonometric roundoff at
      // cardinal points must not make outer/hole seams acquire different Ys.
      const spanStart = spanIndex === 0 ? start : cardinalPoint(span.startAngle)
      const spanEnd =
        spanIndex === functionalSpans.length - 1
          ? end
          : cardinalPoint(span.endAngle)
      if (spanStart.y === spanEnd.y) return []
      const side = span.middle().x < center.x ? -1 : 1
      return [
        {
          minY: Math.min(spanStart.y, spanEnd.y),
          maxY: Math.max(spanStart.y, spanEnd.y),
          xAtY: (y: number) =>
            y === spanStart.y
              ? spanStart.x
              : y === spanEnd.y
                ? spanEnd.x
                : center.x +
                  side *
                    Math.sqrt(Math.max(0, radius ** 2 - (y - center.y) ** 2)),
        },
      ]
    })
  })

/**
 * Encloses retained pour copper in axis-aligned SRJ rectangles. Input and output
 * are board-world points in mm, right-handed (+X right, +Y up, +Z above).
 * Bands split at every boundary/extremum and have height at most 0.1 mm.
 * Their widths cover each boundary's entire band, not just a sample at its
 * midpoint. Holes and concave channels remain open where the cover permits.
 */
export const getObstaclesFromCopperPour = (
  pour: PcbCopperPour,
  connectedTo: Obstacle["connectedTo"],
): Obstacle[] => {
  const rings =
    pour.shape === "brep"
      ? [
          pour.brep_shape.outer_ring.vertices,
          ...pour.brep_shape.inner_rings.map((ring) => ring.vertices),
        ]
      : pour.shape === "polygon"
        ? [pour.points]
        : [
            [
              { x: -pour.width / 2, y: -pour.height / 2 },
              { x: pour.width / 2, y: -pour.height / 2 },
              { x: pour.width / 2, y: pour.height / 2 },
              { x: -pour.width / 2, y: pour.height / 2 },
            ].map((point) =>
              applyToPoint(
                compose(
                  translate(pour.center.x, pour.center.y),
                  rotateDEG(pour.rotation ?? 0),
                ),
                point,
              ),
            ),
          ]
  const spans = rings.flatMap(getBoundarySpans)
  const boundaryYs = [
    ...new Set(spans.flatMap((span) => [span.minY, span.maxY])),
  ].sort((a, b) => a - b)
  const obstacles: Obstacle[] = []
  const starts = [...spans].sort((a, b) => a.minY - b.minY)
  const active = new Set<BoundarySpan>()
  let nextStart = 0
  for (let index = 0; index < boundaryYs.length - 1; index++) {
    const startY = boundaryYs[index]
    const endY = boundaryYs[index + 1]
    const intervalMiddleY = (startY + endY) / 2
    while (
      nextStart < starts.length &&
      starts[nextStart].minY < intervalMiddleY
    ) {
      active.add(starts[nextStart++])
    }
    for (const span of active) {
      if (span.maxY <= intervalMiddleY) active.delete(span)
    }
    // Boundaries cannot cross inside a valid ring between consecutive events.
    const activeSpans = [...active].sort(
      (a, b) => a.xAtY(intervalMiddleY) - b.xAtY(intervalMiddleY),
    )
    const bandCount = Math.max(1, Math.ceil((endY - startY) / MAX_BAND_HEIGHT))
    for (let band = 0; band < bandCount; band++) {
      const minY = startY + ((endY - startY) * band) / bandCount
      const maxY = startY + ((endY - startY) * (band + 1)) / bandCount
      const middleY = (minY + maxY) / 2
      for (
        let spanIndex = 0;
        spanIndex < activeSpans.length - 1;
        spanIndex += 2
      ) {
        const left = activeSpans[spanIndex]
        const right = activeSpans[spanIndex + 1]
        const minX = Math.min(left.xAtY(minY), left.xAtY(maxY))
        const maxX = Math.max(right.xAtY(minY), right.xAtY(maxY))
        // Cover arithmetic roundoff without adding a PCB clearance tolerance.
        const rounding =
          Number.EPSILON *
          8 *
          Math.max(
            1,
            Math.abs(minX),
            Math.abs(maxX),
            Math.abs(minY),
            Math.abs(maxY),
          )
        obstacles.push({
          type: "rect",
          obstacleId: pour.pcb_copper_pour_id,
          layers: [pour.layer],
          center: { x: (minX + maxX) / 2, y: middleY },
          width: maxX - minX + 2 * rounding,
          height: maxY - minY + 2 * rounding,
          connectedTo,
        })
      }
    }
  }
  return obstacles
}
