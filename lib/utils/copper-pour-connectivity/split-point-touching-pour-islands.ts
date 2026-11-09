import { getPourPolygon } from "@tscircuit/circuit-json-util"
import { point } from "@flatten-js/core"
import type { BRepShape } from "circuit-json"

type Ring = BRepShape["outer_ring"]

/** Split a contour that revisits a vertex into its separate physical islands.
 * Input is native pour output in board-world mm (+X right, +Y up). A single
 * shared point cannot carry current between the resulting copper regions.
 */
function splitRing(ring: Ring): Ring[] {
  const visited = new Map<string, number>()
  for (const [index, vertex] of ring.vertices.entries()) {
    const key = `${vertex.x},${vertex.y}`
    const previous = visited.get(key)
    if (previous !== undefined) {
      const loops = [
        ring.vertices.slice(previous, index),
        [...ring.vertices.slice(0, previous), ...ring.vertices.slice(index)],
      ]
      return loops
        .filter((vertices) => vertices.length >= 3)
        .flatMap((vertices) => splitRing({ vertices }))
    }
    visited.set(key, index)
  }
  return [ring]
}

function splitRingAtTouchingVertices(ring: Ring): Ring[] {
  const vertices = ring.vertices
  // Manifold can emit a touching vertex in only one of the incident edges.
  // Insert that existing point into the other edge before separating loops.
  const joinedVertices = vertices.flatMap((start, index) => {
    const end = vertices[(index + 1) % vertices.length]!
    const dx = end.x - start.x
    const dy = end.y - start.y
    const lengthSquared = dx * dx + dy * dy
    if (lengthSquared === 0 || start.bulge) return [start]
    const touches = vertices
      .flatMap((vertex) => {
        const t =
          ((vertex.x - start.x) * dx + (vertex.y - start.y) * dy) /
          lengthSquared
        if (t <= 1e-9 || t >= 1 - 1e-9) return []
        const distance =
          Math.abs((vertex.x - start.x) * dy - (vertex.y - start.y) * dx) /
          Math.sqrt(lengthSquared)
        return distance < 1e-9 ? [{ vertex, t }] : []
      })
      .sort((a, b) => a.t - b.t)
    return [start, ...touches.map(({ vertex }) => vertex)]
  })
  return splitRing({ vertices: joinedVertices })
}

// Native Manifold pour boundaries contain straight edges. Signed area retains
// the distinction between a hole and an island enclosed by a self-touching hole.
function signedArea(ring: Ring): number {
  return (
    ring.vertices.reduce((area, vertex, index) => {
      const next = ring.vertices[(index + 1) % ring.vertices.length]!
      return area + vertex.x * next.y - next.x * vertex.y
    }, 0) / 2
  )
}

export function splitPointTouchingPourIslands(shape: BRepShape): BRepShape[] {
  const inputRings = [shape.outer_ring, ...shape.inner_rings]
  const rings = inputRings.flatMap(splitRingAtTouchingVertices)
  if (rings.length === inputRings.length) return [shape]
  const outerOrientation = Math.sign(signedArea(shape.outer_ring))
  const outerRings = rings.filter(
    (ring) => Math.sign(signedArea(ring)) === outerOrientation,
  )
  const holes = rings.filter(
    (ring) => Math.sign(signedArea(ring)) !== outerOrientation,
  )
  const boundaries = outerRings.map((outer_ring) => ({
    outer_ring,
    area: Math.abs(signedArea(outer_ring)),
    polygon: getPourPolygon({
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "split_boundary",
      layer: "top",
      covered_with_solder_mask: true,
      shape: "brep",
      brep_shape: { outer_ring, inner_rings: [] },
    }),
    inner_rings: [] as Ring[],
  }))
  for (const hole of holes) {
    const containing = boundaries
      .filter(({ polygon }) =>
        hole.vertices.every((vertex) =>
          polygon.contains(point(vertex.x, vertex.y)),
        ),
      )
      .sort((a, b) => a.area - b.area)
    if (
      !containing.length ||
      (containing[1] && containing[0]!.area === containing[1].area)
    ) {
      throw new Error("Split copper pour has an ambiguous hole boundary")
    }
    // A nested copper island may itself have holes; assign each hole to its
    // smallest enclosing outer boundary rather than also to every ancestor.
    containing[0]!.inner_rings.push(hole)
  }
  return boundaries.map(({ outer_ring, inner_rings }) => ({
    outer_ring,
    inner_rings,
  }))
}
