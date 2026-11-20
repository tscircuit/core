import type { TraceStep } from "./walk-trace"

/** A uniform grid of steps, for finding the steps near another step without checking them all. */
export type StepGrid = {
  cellSize: number
  /** Indices into `steps`, keyed by `"column,row"`. */
  cells: Map<string, number[]>
  steps: TraceStep[]
}

/** Cells smaller than this, in mm, only add bookkeeping. */
const MIN_CELL_SIZE = 0.1

/** Places each step in every cell within `reach` of it. */
export function buildStepGrid({
  steps,
  reach,
}: {
  steps: TraceStep[]
  /** How far from a step, in mm, a query should still find it. */
  reach: number
}): StepGrid {
  let totalLength = 0
  for (const step of steps) totalLength += step.length
  const cellSize = Math.max(
    MIN_CELL_SIZE,
    reach,
    totalLength / Math.max(1, steps.length),
  )

  const cells = new Map<string, number[]>()
  steps.forEach((step, index) => {
    for (const key of cellsAlong({ step, cellSize, margin: reach })) {
      const cell = cells.get(key)
      if (cell) {
        cell.push(index)
        continue
      }
      cells.set(key, [index])
    }
  })
  return { cellSize, cells, steps }
}

/** Steps placed in a cell `step` passes through. */
export function stepsNear({
  grid,
  step,
}: {
  grid: StepGrid
  step: TraceStep
}): TraceStep[] {
  const found = new Set<number>()
  for (const key of cellsAlong({ step, cellSize: grid.cellSize, margin: 0 })) {
    for (const index of grid.cells.get(key) ?? []) found.add(index)
  }
  return [...found].map((index) => grid.steps[index])
}

/**
 * Keys of the cells within `margin` mm of a step. The step is sampled every
 * cell, and each sample takes the cells within `margin` plus one cell, so
 * every point within `margin` of the step is covered without visiting the
 * empty cells of a long diagonal's bounding box.
 */
function cellsAlong({
  step,
  cellSize,
  margin,
}: {
  step: TraceStep
  cellSize: number
  margin: number
}): Set<string> {
  const keys = new Set<string>()
  const sampleCount = Math.ceil(step.length / cellSize)
  const span = Math.ceil(margin / cellSize) + 1
  for (let sample = 0; sample <= sampleCount; sample++) {
    const fraction = sample / sampleCount
    const column = Math.floor(
      (step.start.x + (step.end.x - step.start.x) * fraction) / cellSize,
    )
    const row = Math.floor(
      (step.start.y + (step.end.y - step.start.y) * fraction) / cellSize,
    )
    for (let dx = -span; dx <= span; dx++) {
      for (let dy = -span; dy <= span; dy++) {
        keys.add(`${column + dx},${row + dy}`)
      }
    }
  }
  return keys
}
