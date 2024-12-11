import type { SchematicTraceEdge } from "circuit-json"

export const countComplexElements = (
  junctions: {
    x: number
    y: number
  }[],
  edges: SchematicTraceEdge[],
): number => {
  let count = 0

  // Count junctions
  count += junctions.length ?? 0

  // Count crossings
  count += edges.filter((edge) => edge.is_crossing).length

  // Count turns (where direction changes between edges)
  for (let i = 1; i < edges.length; i++) {
    const prev = edges[i - 1]
    const curr = edges[i]
    const prevVertical = Math.abs(prev.from.x - prev.to.x) < 0.01
    const currVertical = Math.abs(curr.from.x - curr.to.x) < 0.01
    if (prevVertical !== currVertical) count++
  }

  return count
}
