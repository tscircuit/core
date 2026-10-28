import type {
  ImplicitBreakoutBounds as Bounds,
  ImplicitBreakoutEdge as BreakoutEdge,
  ImplicitBreakoutSolverPoint,
} from "@tscircuit/props"
import { WindingBreakoutInfeasibleError } from "@tscircuit/winding-breakout-point-solver"
import {
  type BreakoutEdgeBand,
  getBreakoutEdgeLength,
  isVerticalBreakoutEdge,
} from "./assign-single-region-breakout-edges"

const GEOMETRY_EPSILON = 1e-9

/**
 * Slide independently solved blocks of breakout points along one edge so they
 * do not overlap. Banded blocks are pulled toward their band (the outer third
 * of the edge for `start`/`end`); unbanded blocks keep the position the solver
 * chose when there is room. Each block moves rigidly, so its order, spacing
 * and layer stagger are preserved.
 */
export const packBreakoutEdgeGroups = ({
  bounds,
  edge,
  blocks,
  boundaryPointSpacing,
}: {
  bounds: Bounds
  edge: BreakoutEdge
  blocks: readonly {
    band?: BreakoutEdgeBand
    points: readonly ImplicitBreakoutSolverPoint[]
  }[]
  boundaryPointSpacing: number
}): ImplicitBreakoutSolverPoint[] => {
  const vertical = isVerticalBreakoutEdge(edge)
  const edgeMin = vertical ? bounds.minY : bounds.minX
  const edgeMax = vertical ? bounds.maxY : bounds.maxX
  const edgeLength = getBreakoutEdgeLength(bounds, edge)
  const getAxis = (point: ImplicitBreakoutSolverPoint) =>
    vertical ? point.y : point.x

  const placedBlocks = blocks
    .filter((block) => block.points.length > 0)
    .map((block) => {
      const axes = block.points.map(getAxis)
      const low = Math.min(...axes)
      const length = Math.max(...axes) - low
      let targetLow = low
      if (block.band === "start") {
        targetLow = edgeMin + edgeLength / 6 - length / 2
      } else if (block.band === "end") {
        targetLow = edgeMax - edgeLength / 6 - length / 2
      } else if (block.band === "center") {
        targetLow = (edgeMin + edgeMax - length) / 2
      }
      targetLow = Math.max(edgeMin, Math.min(edgeMax - length, targetLow))
      return { ...block, low, length, placedLow: targetLow }
    })
    .sort((first, second) => first.placedLow - second.placedLow)

  let cursor = edgeMin
  for (const block of placedBlocks) {
    block.placedLow = Math.max(block.placedLow, cursor)
    cursor = block.placedLow + block.length + boundaryPointSpacing
  }
  let limit = edgeMax
  for (const block of [...placedBlocks].reverse()) {
    block.placedLow = Math.min(block.placedLow, limit - block.length)
    limit = block.placedLow - boundaryPointSpacing
  }
  const firstBlock = placedBlocks[0]
  if (firstBlock && firstBlock.placedLow < edgeMin - GEOMETRY_EPSILON) {
    const neededLength =
      placedBlocks.reduce((sum, block) => sum + block.length, 0) +
      boundaryPointSpacing * (placedBlocks.length - 1)
    throw new WindingBreakoutInfeasibleError(
      `WindingBreakoutSolver: ${edge} breakout edge needs ${neededLength.toFixed(2)}mm but exposes only ${edgeLength.toFixed(2)}mm`,
    )
  }

  return placedBlocks.flatMap((block) => {
    const shift = block.placedLow - block.low
    return block.points.map((point) =>
      vertical
        ? { ...point, y: point.y + shift }
        : { ...point, x: point.x + shift },
    )
  })
}
