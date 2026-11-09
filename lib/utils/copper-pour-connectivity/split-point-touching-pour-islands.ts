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

export function splitPointTouchingPourIslands(shape: BRepShape): BRepShape[] {
  const vertices = shape.outer_ring.vertices
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
  const outerRings = splitRing({ vertices: joinedVertices })
  if (outerRings.length === 1) return [shape]
  const holes = shape.inner_rings.flatMap(splitRing)
  const result = outerRings.map((outer_ring) => {
    const polygon = getPourPolygon({
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "split_boundary",
      layer: "top",
      covered_with_solder_mask: true,
      shape: "brep",
      brep_shape: { outer_ring, inner_rings: [] },
    })
    return {
      outer_ring,
      inner_rings: holes.filter((ring) =>
        ring.vertices.every((vertex) =>
          polygon.contains(point(vertex.x, vertex.y)),
        ),
      ),
    }
  })
  if (
    result.reduce((count, island) => count + island.inner_rings.length, 0) !==
    holes.length
  ) {
    throw new Error("Split copper pour has an ambiguous hole boundary")
  }
  return result
}
