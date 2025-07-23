import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicTrace } from "circuit-json"
import { getOtherSchematicTraces } from "./get-other-schematic-traces"

const isOrthogonal = (
  edge1: SchematicTrace["edges"][number],
  edge2: SchematicTrace["edges"][number],
): boolean => {
  const isVertical1 = edge1.from.x === edge1.to.x
  const isVertical2 = edge2.from.x === edge2.to.x
  return isVertical1 !== isVertical2
}

const getIntersectionPoint = (
  edge1: SchematicTrace["edges"][number],
  edge2: SchematicTrace["edges"][number],
): { x: number; y: number } | null => {
  if (edge1.from.x === edge1.to.x && edge2.from.x === edge2.to.x) {
    return null
  }

  if (edge1.from.x === edge1.to.x) {
    const x = edge1.from.x
    const m2 = (edge2.to.y - edge2.from.y) / (edge2.to.x - edge2.from.x)
    const b2 = edge2.from.y - m2 * edge2.from.x
    const y = m2 * x + b2

    if (
      x >= Math.min(edge2.from.x, edge2.to.x) &&
      x <= Math.max(edge2.from.x, edge2.to.x) &&
      y >= Math.min(edge2.from.y, edge2.to.y) &&
      y <= Math.max(edge2.from.y, edge2.to.y)
    ) {
      return { x, y }
    }

    return null
  }

  if (edge2.from.x === edge2.to.x) {
    const x = edge2.from.x
    const m1 = (edge1.to.y - edge1.from.y) / (edge1.to.x - edge1.from.x)
    const b1 = edge1.from.y - m1 * edge1.from.x
    const y = m1 * x + b1

    if (
      x >= Math.min(edge1.from.x, edge1.to.x) &&
      x <= Math.max(edge1.from.x, edge1.to.x) &&
      y >= Math.min(edge1.from.y, edge1.to.y) &&
      y <= Math.max(edge1.from.y, edge1.to.y)
    ) {
      return { x, y }
    }
    return null
  }

  const m1 = (edge1.to.y - edge1.from.y) / (edge1.to.x - edge1.from.x)
  const b1 = edge1.from.y - m1 * edge1.from.x

  const m2 = (edge2.to.y - edge2.from.y) / (edge2.to.x - edge2.from.x)
  const b2 = edge2.from.y - m2 * edge2.from.x

  if (m1 === m2) {
    return null
  }

  const x = (b2 - b1) / (m1 - m2)
  const y = m1 * x + b1

  const isWithinEdge1 =
    x >= Math.min(edge1.from.x, edge1.to.x) &&
    x <= Math.max(edge1.from.x, edge1.to.x) &&
    y >= Math.min(edge1.from.y, edge1.to.y) &&
    y <= Math.max(edge1.from.y, edge1.to.y)

  const isWithinEdge2 =
    x >= Math.min(edge2.from.x, edge2.to.x) &&
    x <= Math.max(edge2.from.x, edge2.to.x) &&
    y >= Math.min(edge2.from.y, edge2.to.y) &&
    y <= Math.max(edge2.from.y, edge2.to.y)

  if (isWithinEdge1 && isWithinEdge2) {
    return { x, y }
  }

  return null
}

const areColinearAndOverlapping = (
  edge1: SchematicTrace["edges"][number],
  edge2: SchematicTrace["edges"][number],
): boolean => {
  // Check if both edges are vertical
  if (edge1.from.x === edge1.to.x && edge2.from.x === edge2.to.x && edge1.from.x === edge2.from.x) {
    // Check for y overlap
    const y1 = [edge1.from.y, edge1.to.y].sort((a, b) => a - b)
    const y2 = [edge2.from.y, edge2.to.y].sort((a, b) => a - b)
    return y1[1] >= y2[0] && y2[1] >= y1[0]
  }
  // Check if both edges are horizontal
  if (edge1.from.y === edge1.to.y && edge2.from.y === edge2.to.y && edge1.from.y === edge2.from.y) {
    // Check for x overlap
    const x1 = [edge1.from.x, edge1.to.x].sort((a, b) => a - b)
    const x2 = [edge2.from.x, edge2.to.x].sort((a, b) => a - b)
    return x1[1] >= x2[0] && x2[1] >= x1[0]
  }
  return false
}

export const createSchematicTraceJunctions = ({
  edges: myEdges,
  db,
  source_trace_id,
}: {
  edges: SchematicTrace["edges"]
  db: CircuitJsonUtilObjects
  source_trace_id: string
}): Array<{ x: number; y: number }> => {
  const otherEdges: SchematicTrace["edges"] = getOtherSchematicTraces({
    db,
    source_trace_id,
    sameNetOnly: true,
  }).flatMap((t: SchematicTrace) => t.edges)

  const junctions = new Set<string>()

  const allEdges = [...myEdges, ...otherEdges]
  const endpointCount = new Map<string, number>()
  for (const edge of allEdges) {
    const fromKey = `${edge.from.x},${edge.from.y}`
    const toKey = `${edge.to.x},${edge.to.y}`
    endpointCount.set(fromKey, (endpointCount.get(fromKey) || 0) + 1)
    endpointCount.set(toKey, (endpointCount.get(toKey) || 0) + 1)
  }

  for (const myEdge of myEdges) {
    for (const otherEdge of otherEdges) {
      // Skip if colinear and overlapping (not a true intersection)
      if (areColinearAndOverlapping(myEdge, otherEdge)) continue
      const intersection = getIntersectionPoint(myEdge, otherEdge)
      // console.log("intersection", intersection)
      if (intersection) {
        const pointKey = `${intersection.x},${intersection.y}`
        // Add a junction if the intersection is strictly inside at least one edge, or at the endpoint of either edge
        const isStrictlyInsideMyEdge =
          intersection.x > Math.min(myEdge.from.x, myEdge.to.x) &&
          intersection.x < Math.max(myEdge.from.x, myEdge.to.x) &&
          intersection.y > Math.min(myEdge.from.y, myEdge.to.y) &&
          intersection.y < Math.max(myEdge.from.y, myEdge.to.y)
        const isStrictlyInsideOtherEdge =
          intersection.x > Math.min(otherEdge.from.x, otherEdge.to.x) &&
          intersection.x < Math.max(otherEdge.from.x, otherEdge.to.x) &&
          intersection.y > Math.min(otherEdge.from.y, otherEdge.to.y) &&
          intersection.y < Math.max(otherEdge.from.y, otherEdge.to.y)
        const isEndpointOfMyEdge =
          (intersection.x === myEdge.from.x && intersection.y === myEdge.from.y) ||
          (intersection.x === myEdge.to.x && intersection.y === myEdge.to.y)
        const isEndpointOfOtherEdge =
          (intersection.x === otherEdge.from.x && intersection.y === otherEdge.from.y) ||
          (intersection.x === otherEdge.to.x && intersection.y === otherEdge.to.y)
        if (
          isStrictlyInsideMyEdge ||
          isStrictlyInsideOtherEdge ||
          isEndpointOfMyEdge ||
          isEndpointOfOtherEdge
        ) {
          junctions.add(pointKey)
        }
      }
    }
  }

  // Add a junction at any point that is an endpoint for more than two edges (star/fork connection)
  for (const [pointKey, count] of endpointCount.entries()) {
    if (count > 2) {
      junctions.add(pointKey)
    } else if (count === 2) {
      // Only consider if two or more *distinct* traces meet at this point
      const [x, y] = pointKey.split(",").map(Number)
      // Attach a traceId to each edge (use source_trace_id if available, else fallback to schematic_trace_id or a unique object ref)
      const edgesAtPoint = allEdges.map((edge: any) => ({
        edge,
        traceId: edge.source_trace_id || edge.schematic_trace_id || edge._traceId || edge,
      })).filter(({ edge }) =>
        (edge.from.x === x && edge.from.y === y) ||
        (edge.to.x === x && edge.to.y === y)
      )
      const uniqueTraceIds = new Set(edgesAtPoint.map(e => e.traceId))
      if (uniqueTraceIds.size < 2) continue // Only add junction if two or more distinct traces meet
      if (edgesAtPoint.length === 2) {
        // Get the vectors for both edges at this point
        const [e1, e2] = edgesAtPoint.map(e => e.edge)
        const getVector = (edge: typeof e1) =>
          edge.from.x === x && edge.from.y === y
            ? { x: edge.to.x - x, y: edge.to.y - y }
            : { x: edge.from.x - x, y: edge.from.y - y }
        const v1 = getVector(e1)
        const v2 = getVector(e2)
        // Check if vectors are colinear (cross product == 0 and dot product < 0 for opposite direction)
        const cross = v1.x * v2.y - v1.y * v2.x
        const dot = v1.x * v2.x + v1.y * v2.y
        const isColinear = Math.abs(cross) < 1e-8 && dot < 0
        if (!isColinear) {
          junctions.add(pointKey)
        }
      }
    }
  }

  return Array.from(junctions).map((j) => {
    const [x, y] = j.split(",").map(Number)
    return { x, y }
  })
}
