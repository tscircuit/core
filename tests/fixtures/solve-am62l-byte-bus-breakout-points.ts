import type { ImplicitBreakoutPointSolverFn } from "@tscircuit/props"
import { defaultImplicitBreakoutPointSolverFn } from "lib/components/primitive-components/Breakout/default-implicit-breakout-point-solver"

/**
 * Keep each byte bus near its source-pad bank while retaining the winding
 * solver's coordinated connection order and layer assignments. Positions are
 * points in right-handed PCB world space, in mm (+X right, +Y top, +Z above the board).
 */
export const solveAm62lByteBusBreakoutPoints: ImplicitBreakoutPointSolverFn = (
  input,
) => {
  const output = defaultImplicitBreakoutPointSolverFn(input)
  if (output instanceof Promise) throw new Error("Expected synchronous solver")
  const breakoutPoints = output.breakoutPoints.map((point) => ({ ...point }))
  const connections = input.connections.flatMap((connection) =>
    "type" in connection ? connection.connections : [connection],
  )
  for (const region of input.regions) {
    for (const bus of input.buses) {
      const connectionIds = new Set(bus.connectionIds)
      const busPoints = breakoutPoints.filter(
        (point) =>
          point.regionId === region.regionId &&
          connectionIds.has(point.connectionId),
      )
      const sourceYs = connections
        .filter((connection) => connectionIds.has(connection.connectionId))
        .flatMap((connection) =>
          connection.endpoints
            .filter((endpoint) => endpoint.regionId === region.regionId)
            .map((endpoint) => endpoint.position.y),
        )
      if (!busPoints.length || !sourceYs.length) continue
      const minY = Math.min(...busPoints.map((point) => point.y))
      const maxY = Math.max(...busPoints.map((point) => point.y))
      const sourceCenterY =
        sourceYs.reduce((sum, y) => sum + y, 0) / sourceYs.length
      const offsetY = Math.max(
        region.bounds.minY - minY + input.boundaryPointSpacing,
        Math.min(
          region.bounds.maxY - maxY - input.boundaryPointSpacing,
          sourceCenterY - (minY + maxY) / 2,
        ),
      )
      for (const point of busPoints) point.y += offsetY
    }
  }
  return { breakoutPoints }
}
