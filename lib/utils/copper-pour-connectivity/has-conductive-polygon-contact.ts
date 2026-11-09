import type { Point, Polygon } from "@flatten-js/core"

/** Native polygonal pours conduct across overlap or a shared edge, not isolated
 * points. Both polygons use the same scaled board-world coordinate frame.
 */
export function hasConductivePolygonContact(
  a: Polygon,
  b: Polygon,
  tolerance: number,
): boolean {
  for (const [first, second] of [
    [a, b],
    [b, a],
  ]) {
    for (const edge of first!.edges) {
      for (const sample of [edge.start, edge.middle()]) {
        if (second!.contains(sample) && !second!.findEdgeByPoint(sample))
          return true
      }
    }
  }
  for (const first of a.edges) {
    if (!first.isSegment) continue
    for (const second of b.edges) {
      if (!second.isSegment || !first.box.intersect(second.box)) continue
      const contacts: Point[] = first.shape.intersect(second.shape)
      if (
        contacts.length >= 2 &&
        contacts[0]!.distanceTo(contacts[1]!)[0] > tolerance
      )
        return true
      if (
        contacts.some((contact) =>
          [first.start, first.end, second.start, second.end].every(
            (endpoint) => endpoint.distanceTo(contact)[0] > tolerance,
          ),
        )
      )
        return true
    }
  }
  return false
}
