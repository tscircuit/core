import type { Edge, Polygon, Point } from "./types"
import { closePolygon, pointKey, samePoint } from "./polygon-utils"

const isFilledCell = ({
  filledMask,
  x,
  y,
  maskWidth,
  maskHeight,
}: {
  filledMask: boolean[]
  x: number
  y: number
  maskWidth: number
  maskHeight: number
}) => {
  if (x < 0 || x >= maskWidth || y < 0 || y >= maskHeight) return false
  return filledMask[y * maskWidth + x] ?? false
}

export const extractBoundaryEdges = ({
  filledMask,
  maskWidth,
  maskHeight,
}: {
  filledMask: boolean[]
  maskWidth: number
  maskHeight: number
}): Edge[] => {
  // Emit directed cell edges with the filled region on the right so the traced
  // loops have a stable winding before we convert them into BRep rings.
  const edges: Edge[] = []

  for (let y = 0; y < maskHeight; y++) {
    for (let x = 0; x < maskWidth; x++) {
      if (!isFilledCell({ filledMask, maskWidth, maskHeight, x, y })) continue

      if (!isFilledCell({ filledMask, maskWidth, maskHeight, x, y: y - 1 })) {
        edges.push({
          start: { x, y },
          end: { x: x + 1, y },
        })
      }

      if (!isFilledCell({ filledMask, maskWidth, maskHeight, x: x + 1, y })) {
        edges.push({
          start: { x: x + 1, y },
          end: { x: x + 1, y: y + 1 },
        })
      }

      if (!isFilledCell({ filledMask, maskWidth, maskHeight, x, y: y + 1 })) {
        edges.push({
          start: { x: x + 1, y: y + 1 },
          end: { x, y: y + 1 },
        })
      }

      if (!isFilledCell({ filledMask, maskWidth, maskHeight, x: x - 1, y })) {
        edges.push({
          start: { x, y: y + 1 },
          end: { x, y },
        })
      }
    }
  }

  return edges
}

const directionIndex = ({
  fromPoint,
  toPoint,
}: {
  fromPoint: Point
  toPoint: Point
}) => {
  if (toPoint.x > fromPoint.x) return 0
  if (toPoint.y > fromPoint.y) return 1
  if (toPoint.x < fromPoint.x) return 2
  return 3
}

const getTurnPriority = (previousDirection: number, nextDirection: number) => {
  const difference = (nextDirection - previousDirection + 4) % 4
  if (difference === 1) return 0
  if (difference === 0) return 1
  if (difference === 3) return 2
  return 3
}

export const traceBoundaryLoops = (edges: Edge[]): Polygon[] => {
  const remainingOutgoing = new Map<string, Edge[]>()

  for (const edge of edges) {
    const key = pointKey(edge.start)
    const current = remainingOutgoing.get(key)
    if (current) {
      current.push(edge)
    } else {
      remainingOutgoing.set(key, [edge])
    }
  }

  const takeNextEdge = (
    start: Point,
    previousDirection: number,
  ): Edge | undefined => {
    const key = pointKey(start)
    const candidates = remainingOutgoing.get(key)
    if (!candidates || candidates.length === 0) return undefined

    let bestIndex = 0
    let bestPriority = Infinity
    for (let index = 0; index < candidates.length; index++) {
      const candidate = candidates[index]!
      const priority = getTurnPriority(
        previousDirection,
        directionIndex({
          fromPoint: candidate.start,
          toPoint: candidate.end,
        }),
      )
      if (priority < bestPriority) {
        bestPriority = priority
        bestIndex = index
      }
    }

    const [selected] = candidates.splice(bestIndex, 1)
    if (candidates.length === 0) {
      remainingOutgoing.delete(key)
    }
    return selected
  }

  const loops: Polygon[] = []

  while (remainingOutgoing.size > 0) {
    const [firstKey, firstEdges] = remainingOutgoing.entries().next().value as [
      string,
      Edge[],
    ]
    const firstEdge = firstEdges.shift()!
    if (firstEdges.length === 0) {
      remainingOutgoing.delete(firstKey)
    }

    const loop: Polygon = [firstEdge.start]
    let currentPoint = firstEdge.end
    let previousDirection = directionIndex({
      fromPoint: firstEdge.start,
      toPoint: firstEdge.end,
    })

    while (!samePoint(currentPoint, firstEdge.start)) {
      loop.push(currentPoint)
      const nextEdge = takeNextEdge(currentPoint, previousDirection)
      if (!nextEdge) {
        throw new Error("Silkscreen bitmap contour trace produced an open loop")
      }
      previousDirection = directionIndex({
        fromPoint: nextEdge.start,
        toPoint: nextEdge.end,
      })
      currentPoint = nextEdge.end
    }

    loops.push(closePolygon(loop))
  }

  return loops
}
