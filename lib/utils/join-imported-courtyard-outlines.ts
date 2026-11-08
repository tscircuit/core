import type { PcbCourtyardOutline, Point } from "circuit-json"

const getSignedPolygonArea2 = (points: Point[]): number => {
  let area2 = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    area2 += a.x * b.y - b.x * a.y
  }
  return area2
}

/**
 * Join legacy KiCad courtyard line records into complete polygons. All points
 * remain in the input PCB frame (mm, +X right, +Y up, +Z out of page); no transform
 * is applied. Keep components and layers separate and never mutate input records.
 */
export function joinImportedCourtyardOutlines(
  courtyards: PcbCourtyardOutline[],
  componentName: string,
): Map<PcbCourtyardOutline, Point[]> {
  const polygons = new Map<PcbCourtyardOutline, Point[]>()
  const samePoint = (a: Point, b: Point) =>
    Math.hypot(a.x - b.x, a.y - b.y) < 1e-6
  const twoPointCourtyards = courtyards.filter(
    (courtyard) => courtyard.outline.length === 2,
  )
  const pending = twoPointCourtyards.filter(
    (courtyard) => !samePoint(courtyard.outline[0]!, courtyard.outline[1]!),
  )
  if (twoPointCourtyards.length > 0 && pending.length === 0) {
    throw new Error(
      `Imported courtyard for "${componentName}" needs at least three polygon vertices.`,
    )
  }
  while (pending.length) {
    const first = pending.shift()!
    const outline = [...first.outline]
    while (!samePoint(outline[0], outline.at(-1)!)) {
      const end = outline.at(-1)!
      const nextIndex = pending.findIndex(
        (candidate) =>
          candidate.pcb_component_id === first.pcb_component_id &&
          candidate.layer === first.layer &&
          candidate.outline.some((point) => samePoint(point, end)),
      )
      if (nextIndex === -1) {
        throw new Error(
          `Imported courtyard for "${componentName}" has disconnected line segments; provide a complete closed polygon.`,
        )
      }
      const [next] = pending.splice(nextIndex, 1)
      outline.push(
        samePoint(next.outline[0], end) ? next.outline[1] : next.outline[0],
      )
    }
    outline.pop()
    if (
      outline.length < 3 ||
      Math.abs(getSignedPolygonArea2(outline)) <= 1e-9
    ) {
      throw new Error(
        `Imported courtyard for "${componentName}" needs at least three polygon vertices.`,
      )
    }
    polygons.set(first, outline)
  }
  return polygons
}
