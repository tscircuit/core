import type { PcbBoard } from "circuit-json"

export function getRectangularPanelBoardBounds(board: PcbBoard) {
  const outline = board.outline?.filter(
    (position, outlineIndex, vertices) =>
      outlineIndex === 0 ||
      position.x !== vertices[0]!.x ||
      position.y !== vertices[0]!.y,
  )
  if (outline?.length) {
    const minX =
      Math.round(Math.min(...outline.map((position) => position.x)) * 1e6) / 1e6
    const maxX =
      Math.round(Math.max(...outline.map((position) => position.x)) * 1e6) / 1e6
    const minY =
      Math.round(Math.min(...outline.map((position) => position.y)) * 1e6) / 1e6
    const maxY =
      Math.round(Math.max(...outline.map((position) => position.y)) * 1e6) / 1e6
    const corners = new Set(
      outline.map(
        (position) =>
          `${Math.round(position.x * 1e6)}:${Math.round(position.y * 1e6)}`,
      ),
    )
    if (
      corners.size !== 4 ||
      outline.some(
        (position) =>
          (Math.abs(position.x - minX) > 1e-6 &&
            Math.abs(position.x - maxX) > 1e-6) ||
          (Math.abs(position.y - minY) > 1e-6 &&
            Math.abs(position.y - maxY) > 1e-6),
      )
    )
      throw new Error(
        "V-scoring and explicit panel tab controls require axis-aligned rectangular board outlines",
      )
    return { minX, maxX, minY, maxY }
  }
  if (
    board.width === undefined ||
    board.height === undefined ||
    board.width <= 0 ||
    board.height <= 0
  )
    throw new Error(
      "V-scoring and explicit panel tab controls require positive rectangular board dimensions",
    )
  return {
    minX: board.center.x - board.width / 2,
    maxX: board.center.x + board.width / 2,
    minY: board.center.y - board.height / 2,
    maxY: board.center.y + board.height / 2,
  }
}
