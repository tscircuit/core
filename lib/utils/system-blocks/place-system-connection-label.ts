import type { Point } from "circuit-json"
import type { SystemRoutingObstacle } from "./find-system-orthogonal-path"

/** Half the estimated glyph height plus halo, in diagram mm. */
const TEXT_HALF_HEIGHT = 2
/** Half the reserved label slot height, in diagram mm. */
const SLOT_HALF_HEIGHT = 2.5
/** Target fillet radius of the rounding pass, in diagram mm. */
const CORNER_RADIUS = 12

const overlaps = (
  a: SystemRoutingObstacle,
  b: SystemRoutingObstacle,
  margin = 0,
) =>
  a.left < b.right + margin &&
  a.right > b.left - margin &&
  a.bottom < b.top + margin &&
  a.top > b.bottom - margin

/** Each corner with the bounds of the fillet that rounding would like to draw. */
const filletsOf = (route: Point[]) =>
  route.slice(1, -1).map((corner, index) => {
    const previous = route[index]
    const next = route[index + 2]
    const trim = Math.min(
      CORNER_RADIUS,
      (Math.abs(corner.x - previous.x) + Math.abs(corner.y - previous.y)) / 2,
      (Math.abs(next.x - corner.x) + Math.abs(next.y - corner.y)) / 2,
    )
    const xs = [
      corner.x,
      corner.x + Math.sign(previous.x - corner.x) * trim,
      corner.x + Math.sign(next.x - corner.x) * trim,
    ]
    const ys = [
      corner.y,
      corner.y + Math.sign(previous.y - corner.y) * trim,
      corner.y + Math.sign(next.y - corner.y) * trim,
    ]
    return {
      corner,
      bounds: {
        left: Math.min(...xs),
        right: Math.max(...xs),
        bottom: Math.min(...ys),
        top: Math.max(...ys),
      },
    }
  })

/**
 * Choose a label slot near a routed wire. Prefer a clear slot below a
 * horizontal run, with slots above and beside the wire as fallbacks. Favor
 * space near the wire's midpoint and leave room for rounded corners.
 * All geometry is page-centered diagram mm (+X right, +Y up); `width` includes
 * the label's horizontal padding. The result is the slot's center point.
 */
export function placeSystemConnectionLabel({
  route,
  width,
  obstacles,
  labels,
  otherRoutes,
}: {
  route: Point[]
  width: number
  /** Blocks and group headings, which text must clear by 1 mm. */
  obstacles: SystemRoutingObstacle[]
  /** Padded slots of the labels placed so far, which may touch but not overlap. */
  labels: SystemRoutingObstacle[]
  /** Other wires' orthogonal polylines, which must not run through the text. */
  otherRoutes: Point[][]
}): Point {
  const halfWidth = width / 2
  const lengths = route
    .slice(1)
    .map(
      (end, index) =>
        Math.abs(end.x - route[index].x) + Math.abs(end.y - route[index].y),
    )
  const total = lengths.reduce((sum, length) => sum + length, 0)
  const otherSegments = otherRoutes.flatMap((other) =>
    other.slice(1).map((end, index) => [other[index], end] as const),
  )
  const fillets = [route, ...otherRoutes].flatMap(filletsOf)
  let best: { center: Point; cost: number } | undefined
  const consider = (
    center: Point,
    along: number,
    placement: "below" | "beside" | "detached",
  ) => {
    const slot = {
      left: center.x - halfWidth,
      right: center.x + halfWidth,
      bottom: center.y - SLOT_HALF_HEIGHT,
      top: center.y + SLOT_HALF_HEIGHT,
    }
    // Wires may pass the padded slot in a neighboring 3 mm lane, but not the text.
    const text = {
      left: slot.left + 1,
      right: slot.right - 1,
      bottom: center.y - TEXT_HALF_HEIGHT,
      top: center.y + TEXT_HALF_HEIGHT,
    }
    const crosses = (a: Point, b: Point) =>
      Math.min(a.x, b.x) < text.right &&
      Math.max(a.x, b.x) > text.left &&
      Math.min(a.y, b.y) < text.top &&
      Math.max(a.y, b.y) > text.bottom
    // When nothing is clear, text over a wire still reads; text over a block
    // or over other text does not.
    let conflicts =
      obstacles.filter((r) => overlaps(slot, r, 1)).length * 10 +
      labels.filter((r) => overlaps(slot, r)).length * 4
    for (const [a, b] of otherSegments) if (crosses(a, b)) conflicts++
    for (let index = 0; index < lengths.length; index++)
      if (crosses(route[index], route[index + 1])) conflicts++
    // Text off its wire must still read as belonging to it: no other wire
    // may be as near to the text as its own.
    const gap = ([a, b]: readonly [Point, Point]) =>
      Math.hypot(
        Math.max(
          0,
          text.left - Math.max(a.x, b.x),
          Math.min(a.x, b.x) - text.right,
        ),
        Math.max(
          0,
          text.bottom - Math.max(a.y, b.y),
          Math.min(a.y, b.y) - text.top,
        ),
      )
    const ownGap = Math.min(
      ...lengths.map((_, index) => gap([route[index], route[index + 1]])),
    )
    const ambiguous = otherSegments.some((segment) => gap(segment) < ownGap + 1)
    // Text inside a fillet's bounds shrinks that fillet to the trim at which
    // its bounds clear the text. Avoid slots that leave a corner nearly sharp.
    let squeeze = 0
    for (const { corner, bounds } of fillets) {
      if (!overlaps(text, bounds)) continue
      const trim = Math.max(
        text.left - corner.x,
        corner.x - text.right,
        text.bottom - corner.y,
        corner.y - text.top,
      )
      squeeze += trim < 3 ? 150 : trim < 6 ? 60 : 15
    }
    const cost =
      conflicts * 1000 +
      squeeze +
      Math.abs(along - total / 2) +
      (ambiguous ? 300 : 0) +
      { below: 0, beside: 120, detached: 400 }[placement]
    if (!best || cost < best.cost - 1e-9) best = { center, cost }
  }
  let traveled = 0
  for (let host = 0; host < lengths.length; host++) {
    const start = route[host]
    const end = route[host + 1]
    const horizontal = start.y === end.y
    const axis = horizontal ? "x" : "y"
    // Leave the attachment stub clear for the arrowhead.
    const startInset = host === 0 ? 4 : 1
    const endInset = host === lengths.length - 1 ? 4 : 1
    const extent = horizontal ? halfWidth : SLOT_HALF_HEIGHT
    const direction = Math.sign(end[axis] - start[axis])
    const first = startInset + extent
    const last = lengths[host] - endInset - extent
    const middle = lengths[host] / 2
    const fits = first <= last
    const offsets = !fits
      ? [middle]
      : [
          Math.min(last, Math.max(first, middle)),
          ...Array.from(
            { length: Math.floor((last - first) / 2) + 1 },
            (_, step) => first + step * 2,
          ),
          last,
        ]
    for (const offset of offsets) {
      const anchor = {
        ...start,
        [axis]: start[axis] + direction * offset,
      } as Point
      for (const side of [1, -1])
        consider(
          horizontal
            ? { x: anchor.x, y: anchor.y + side * 4.5 }
            : { x: anchor.x + side * (halfWidth + 2), y: anchor.y },
          traveled + offset,
          horizontal && side === -1 ? "below" : "beside",
        )
    }
    traveled += lengths[host]
  }
  if (!best || best.cost >= 1000) {
    // No adjacent slot is clear. Look for free space around the
    // wire's midpoint; the cost keeps the text as near to it as possible.
    let remaining = total / 2
    let middle = route[0]
    for (let index = 0; index < lengths.length; index++) {
      if (remaining <= lengths[index]) {
        const start = route[index]
        const end = route[index + 1]
        const t = lengths[index] ? remaining / lengths[index] : 0
        middle = {
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        }
        break
      }
      remaining -= lengths[index]
    }
    for (let dx = -30; dx <= 30; dx += 3)
      for (let dy = -30; dy <= 30; dy += 3)
        consider(
          { x: middle.x + dx, y: middle.y + dy },
          total / 2 + Math.abs(dx) + Math.abs(dy),
          "detached",
        )
  }
  return best!.center
}
