import { breakoutProps } from "@tscircuit/props"
import { BreakoutPointSolver } from "@tscircuit/breakout-point-solver"
import { Group } from "../Group/Group"
import { AutoplacedBreakoutPoint } from "../AutoplacedBreakoutPoint"
import { BreakoutPoint } from "../BreakoutPoint"
import { Trace } from "../Trace/Trace"
import type { Port } from "../Port"
import type { z } from "zod"
import { createBreakoutPointSolverInput } from "./createBreakoutPointSolverInput"

export class Breakout extends Group<typeof breakoutProps> {
  constructor(props: z.input<typeof breakoutProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  /**
   * Find ports inside this breakout group that are connected to traces
   * crossing the breakout boundary, and create auto-placed BreakoutPoint
   * children for them. Positions are not set here — they will be determined
   * after PcbLayout.
   */
  doInitialCreateAutoplacedBreakoutPoints(): void {
    const portsInBreakout = this.selectAll("port") as Port[]
    const breakoutPortSet = new Set(portsInBreakout)

    // Find ports that already have manual breakout points
    const manualBreakoutPoints = this.children.filter(
      (c) => c instanceof BreakoutPoint,
    ) as BreakoutPoint[]
    const manuallyMappedPorts = new Set(
      manualBreakoutPoints
        .map((bp) => {
          bp._matchConnection()
          return bp.matchedPort
        })
        .filter(Boolean),
    )

    // Walk traces on the parent board to find cross-boundary connections
    const board = this.parent
    if (!board) return

    const allTraces = board.children.filter(
      (c) => c instanceof Trace,
    ) as Trace[]

    const autoPlacedPorts = new Set<Port>()

    for (const trace of allTraces) {
      const result = trace._findConnectedPorts()
      if (!result.allPortsFound || !result.ports) continue

      for (const port of result.ports) {
        // Port is inside breakout and trace crosses boundary
        const isInside = breakoutPortSet.has(port)
        const hasOutsidePort = result.ports.some((p) => !breakoutPortSet.has(p))
        if (!isInside || !hasOutsidePort) continue

        // Skip if already covered by a manual or auto breakout point
        if (manuallyMappedPorts.has(port)) continue
        if (autoPlacedPorts.has(port)) continue

        autoPlacedPorts.add(port)

        // Create auto-placed breakout point (no position yet)
        const breakoutPoint = new AutoplacedBreakoutPoint({})
        breakoutPoint.matchedPort = port
        breakoutPoint.matchedSourceTraceId = trace.source_trace_id
        this.add(breakoutPoint)
      }
    }
  }

  doInitialPcbAutoplaceBreakoutPoints(): void {
    if (this.root?.pcbDisabled) return

    const solverInput = createBreakoutPointSolverInput(this)
    if (!solverInput) return

    const solver = new BreakoutPointSolver(solverInput)
    solver.solve()
    const output = solver.getOutput()

    const autoBreakoutPoints = this.children.filter(
      (c) => c instanceof AutoplacedBreakoutPoint,
    ) as AutoplacedBreakoutPoint[]

    // The solver places breakout points exactly on the group boundary
    // (bounds.minX/maxX/minY/maxY). When the autorouter later builds a
    // quadtree mesh over the same bounds, repeated halving introduces
    // floating-point drift (≈4e-16) so a point exactly at the boundary
    // can fall outside the nearest mesh node. Nudge solved positions a
    // fraction of a micrometer inward to keep them strictly inside.
    const BOUNDARY_INSET_MM = 1e-4 // 0.1 μm – well below PCB manufacturing precision
    const { bounds } = solverInput
    const insetWithinBounds = (x: number, y: number) => ({
      x: Math.max(
        bounds.minX + BOUNDARY_INSET_MM,
        Math.min(bounds.maxX - BOUNDARY_INSET_MM, x),
      ),
      y: Math.max(
        bounds.minY + BOUNDARY_INSET_MM,
        Math.min(bounds.maxY - BOUNDARY_INSET_MM, y),
      ),
    })

    for (const solvedPoint of output.breakoutPoints) {
      const matchingBreakoutPoint = autoBreakoutPoints.find(
        (child) =>
          child.matchedPort?.source_port_id === solvedPoint.sourcePortId,
      )
      if (matchingBreakoutPoint) {
        matchingBreakoutPoint.matchedSourceTraceId = solvedPoint.sourceTraceId
        const insetPoint = insetWithinBounds(solvedPoint.x, solvedPoint.y)
        matchingBreakoutPoint._setPositionFromLayout({
          x: insetPoint.x,
          y: insetPoint.y,
        })
      }
    }
  }

  doInitialPcbPrimitiveRender(): void {
    super.doInitialPcbPrimitiveRender()
  }
}
