import type { PcbCourtyardOutline, Point } from "circuit-json"

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
  const lineSegments = courtyards.filter(
    (courtyard) => courtyard.outline.length === 2,
  )
  if (lineSegments.length === 0) {
    return polygons
  }

  const samePoint = (a: Point, b: Point) =>
    Math.hypot(a.x - b.x, a.y - b.y) < 1e-6

  // Group line segments by component and layer
  const groups = new Map<string, PcbCourtyardOutline[]>()
  for (const seg of lineSegments) {
    const key = `${seg.pcb_component_id ?? ""}:${seg.layer ?? ""}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(seg)
  }

  for (const [key, pending] of groups.entries()) {
    let closedPolygonsInGroup = 0
    while (pending.length) {
      const first = pending.shift()!
      const outline = [...first.outline]
      let failed = false
      while (!samePoint(outline[0], outline.at(-1)!)) {
        const end = outline.at(-1)!
        const nextIndex = pending.findIndex((candidate) =>
          candidate.outline.some((point) => samePoint(point, end)),
        )
        if (nextIndex === -1) {
          failed = true
          break
        }
        const [next] = pending.splice(nextIndex, 1)
        outline.push(
          samePoint(next.outline[0], end) ? next.outline[1] : next.outline[0],
        )
      }
      if (failed) {
        continue
      }
      outline.pop()
      if (outline.length < 3) {
        continue
      }
      polygons.set(first, outline)
      closedPolygonsInGroup++
    }

    if (closedPolygonsInGroup === 0) {
      throw new Error(
        `Imported courtyard for "${componentName}" has disconnected line segments; provide a complete closed polygon.`,
      )
    }
  }

  return polygons
}
