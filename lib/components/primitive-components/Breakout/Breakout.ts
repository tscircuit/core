import { BreakoutPointSolver } from "@tscircuit/breakout-point-solver"
import { breakoutProps } from "@tscircuit/props"
import { AutoplacedBreakoutPoint } from "../AutoplacedBreakoutPoint"
import { BreakoutPoint } from "../BreakoutPoint"
import { Group } from "../Group/Group"
import type { Port } from "../Port"
import type { Trace } from "../Trace/Trace"
import { createBreakoutPointSolverInput } from "./createBreakoutPointSolverInput"

const BREAKOUT_BOUNDARY_INSET_MM = 1e-4

const insetPointWithinBounds = ({
  point,
  bounds,
}: {
  point: { x: number; y: number }
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}) => ({
  x: Math.max(
    bounds.minX + BREAKOUT_BOUNDARY_INSET_MM,
    Math.min(bounds.maxX - BREAKOUT_BOUNDARY_INSET_MM, point.x),
  ),
  y: Math.max(
    bounds.minY + BREAKOUT_BOUNDARY_INSET_MM,
    Math.min(bounds.maxY - BREAKOUT_BOUNDARY_INSET_MM, point.y),
  ),
})

export class Breakout extends Group<typeof breakoutProps> {
  override get isRoutingDirective() {
    return true
  }

  get config() {
    return {
      ...super.config,
      zodProps: breakoutProps,
    }
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

    // Walk every trace in the enclosing routing scope. Connection props can
    // create traces below components (for example, below a resistor), so
    // checking only direct board children misses valid boundary crossings.
    const allTraces = this.getSubcircuit().selectAll("trace") as Trace[]

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

    for (const solvedPoint of output.breakoutPoints) {
      const matchingBreakoutPoint = autoBreakoutPoints.find(
        (child) =>
          child.matchedPort?.source_port_id === solvedPoint.sourcePortId,
      )
      if (matchingBreakoutPoint) {
        // Exact boundary coordinates can drift outside a quadtree cell after
        // repeated subdivision. A 0.1 μm inset keeps the routing endpoint
        // inside the group without affecting manufacturable geometry.
        const insetPoint = insetPointWithinBounds({
          point: solvedPoint,
          bounds: solverInput.bounds,
        })
        matchingBreakoutPoint._applySolvedBreakoutPoint({
          sourceTraceId: solvedPoint.sourceTraceId,
          position: insetPoint,
        })
      }
    }
  }

  doInitialPcbPrimitiveRender(): void {
    super.doInitialPcbPrimitiveRender()
  }
}
