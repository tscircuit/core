import { distance, type Point } from "@tscircuit/math-utils"

type Edge = {
  from: Point
  to: Point
}

export const getStubEdges = ({
  firstEdge,
  firstEdgePort,
  firstDominantDirection,
  lastEdge,
  lastEdgePort,
  lastDominantDirection,
}:
  | {
      firstEdge?: undefined
      firstEdgePort?: undefined
      firstDominantDirection?: undefined
      lastEdge: Edge
      lastEdgePort: { position: Point }
      lastDominantDirection: "left" | "right" | "up" | "down"
    }
  | {
      lastEdge?: undefined
      lastEdgePort?: undefined
      lastDominantDirection?: undefined
      firstEdge: Edge
      firstEdgePort: { position: Point }
      firstDominantDirection: "left" | "right" | "up" | "down"
    }) => {
  if (firstEdge && firstEdgePort) {
    return getStubEdges({
      lastEdge: firstEdge,
      lastEdgePort: firstEdgePort,
      lastDominantDirection: firstDominantDirection,
    })
      .reverse()
      .map((e: any) => ({
        from: e.to,
        to: e.from,
      }))
  }

  const edges: Edge[] = []
  if (lastEdge && lastEdgePort) {
    const intermediatePoint = { x: lastEdge.to.x, y: lastEdge.to.y }

    // If the last movement was horizontal (left/right)
    if (lastDominantDirection === "left" || lastDominantDirection === "right") {
      // First continue horizontally to align with port's x-position
      intermediatePoint.x = lastEdgePort.position.x
      edges.push({
        from: lastEdge.to,
        to: { ...intermediatePoint },
      })

      // Then move vertically to reach port's y-position
      edges.push({
        from: intermediatePoint,
        to: { ...lastEdgePort.position },
      })
    }
    // If the last movement was vertical (up/down)
    else {
      // First continue vertically to align with port's y-position
      intermediatePoint.y = lastEdgePort.position.y
      edges.push({
        from: lastEdge.to,
        to: { ...intermediatePoint },
      })

      // Then move horizontally to reach port's x-position
      edges.push({
        from: intermediatePoint,
        to: { ...lastEdgePort.position },
      })
    }
  }

  if (edges.length === 2 && distance(edges[1].from, edges[1].to) < 0.01) {
    edges.pop()
  }

  return edges
}
