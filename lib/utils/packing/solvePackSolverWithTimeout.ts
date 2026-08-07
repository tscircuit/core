import type { PackSolver2 } from "calculate-packing"

type PackSolver = Pick<PackSolver2, "failed" | "solve" | "solved" | "step">

export interface PackSolverResult {
  elapsedMs: number
  timedOut: boolean
}

export const solvePackSolverWithTimeout = (
  solver: PackSolver,
  timeoutMs?: number,
  getCurrentTime = () => performance.now(),
): PackSolverResult => {
  if (
    timeoutMs === undefined ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    solver.solve()
    return { elapsedMs: 0, timedOut: false }
  }

  const startedAt = getCurrentTime()
  let elapsedMs = 0

  while (!solver.solved && !solver.failed) {
    solver.step()

    if (solver.solved || solver.failed) break

    elapsedMs = getCurrentTime() - startedAt
    if (elapsedMs >= timeoutMs) {
      return { elapsedMs, timedOut: true }
    }
  }

  return { elapsedMs, timedOut: false }
}
