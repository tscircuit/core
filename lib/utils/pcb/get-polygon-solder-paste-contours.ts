import Flatten from "@flatten-js/core"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type { PcbSolderPastePolygon, Point } from "circuit-json"
import { applyToPoint, compose, scale, translate } from "transformation-matrix"

const createPolygon = (points: Point[]) => {
  const polygon = new Flatten.Polygon(
    points.map(({ x, y }) => new Flatten.Point(x, y)),
  )
  if (polygon.orientation() === Flatten.ORIENTATION.CW) polygon.reverse()
  return polygon
}

/** Points are footprint-local mm (+X right, +Y up, right-handed +Z above). */
export function getPolygonSolderPasteContours({
  points,
  solderPasteMargin,
}: {
  points: Point[]
  solderPasteMargin?: number
}): Pick<PcbSolderPastePolygon, "points" | "holes">[] {
  if (solderPasteMargin === 0) return [{ points }]
  const copper = createPolygon(points)
  let paste = copper
  if (solderPasteMargin === undefined) {
    const bounds = getBoundsFromPoints(points)!
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const copperToPasteTransform = compose(
      translate(centerX, centerY),
      scale(0.7),
      translate(-centerX, -centerY),
    )
    paste = Flatten.BooleanOperations.intersect(
      copper,
      createPolygon(
        points.map((point) => applyToPoint(copperToPasteTransform, point)),
      ),
    )
  } else {
    const vertices = copper.vertices
    const edges = vertices
      .map(
        (point, vertexIndex) =>
          new Flatten.Segment(
            point,
            vertices[(vertexIndex + 1) % vertices.length]!,
          ),
      )
      .filter((edge) => !edge.isZeroLength())
    const offsetEdges = edges.map((edge) =>
      edge.translate(
        edge.tangentInStart().rotate90CW().multiply(solderPasteMargin),
      ),
    )
    // Edge strips and miter joins form the band to add or remove. Boolean
    // operations resolve overlapping bands, split apertures and closed openings.
    for (const [edgeIndex, edge] of edges.entries()) {
      const offsetEdge = offsetEdges[edgeIndex]!
      const strip = createPolygon([
        edge.start,
        edge.end,
        offsetEdge.end,
        offsetEdge.start,
      ])
      paste =
        solderPasteMargin > 0
          ? Flatten.BooleanOperations.unify(paste, strip)
          : Flatten.BooleanOperations.subtract(paste, strip)
      const nextEdgeIndex = (edgeIndex + 1) % edges.length
      const nextEdge = edges[nextEdgeIndex]!
      const nextOffsetEdge = offsetEdges[nextEdgeIndex]!
      const turn = edge.tangentInStart().cross(nextEdge.tangentInStart())
      if (Flatten.Utils.EQ_0(turn) || turn * solderPasteMargin < 0) continue
      const [miter] = new Flatten.Line(
        offsetEdge.start,
        offsetEdge.end,
      ).intersect(new Flatten.Line(nextOffsetEdge.start, nextOffsetEdge.end))
      const join = createPolygon([
        edge.end,
        offsetEdge.end,
        miter!,
        nextOffsetEdge.start,
      ])
      paste =
        solderPasteMargin > 0
          ? Flatten.BooleanOperations.unify(paste, join)
          : Flatten.BooleanOperations.subtract(paste, join)
    }
  }
  return paste.splitToIslands().map((island) => {
    const faces = ([...island.faces] as Flatten.Face[]).sort(
      (a, b) => b.area() - a.area(),
    )
    const [outline, ...holes] = faces
    return {
      points: outline!.vertices.map(({ x, y }) => ({ x, y })),
      ...(holes.length
        ? {
            holes: holes.map((face) =>
              face.vertices.map(({ x, y }) => ({ x, y })),
            ),
          }
        : {}),
    }
  })
}
