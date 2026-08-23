import { breakoutProps } from "@tscircuit/props"
import { AutoplacedBreakoutPoint } from "../AutoplacedBreakoutPoint"
import { BreakoutPoint } from "../BreakoutPoint"
import { Group } from "../Group/Group"
import type { Port } from "../Port"
import type { Trace } from "../Trace/Trace"
import { defaultImplicitBreakoutPointSolverFn } from "./default-implicit-breakout-point-solver"
import { Breakout_doInitialPcbPlacementDesignRuleChecks } from "./Breakout_doInitialPcbPlacementDesignRuleChecks"
import { reportWindingBreakoutInfeasibleError } from "./report-winding-breakout-infeasible-error"
import {
  type ImplicitBreakoutPointPlacement,
  solveImplicitBreakoutPoints,
} from "./solve-implicit-breakout-points"

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

    const ownAutorouter = this.props.autorouter
    const inheritedAutorouter =
      ownAutorouter === undefined
        ? this.parent?.getInheritedProperty("autorouter")
        : undefined
    const implicitBreakoutPointSolverFn =
      typeof ownAutorouter === "object"
        ? ownAutorouter.implicitBreakoutPointSolverFn
        : typeof inheritedAutorouter === "object"
          ? inheritedAutorouter.implicitBreakoutPointSolverFn
          : undefined
    const autoBreakoutPoints = this.children.filter(
      (child) => child instanceof AutoplacedBreakoutPoint,
    ) as AutoplacedBreakoutPoint[]
    if (autoBreakoutPoints.length === 0) return
    if (!this.root || !this.pcb_group_id) return
    const pcbGroup = this.root.db.pcb_group.get(this.pcb_group_id)
    if (!pcbGroup?.width || !pcbGroup.height) return
    const bounds = {
      minX: pcbGroup.center.x - pcbGroup.width / 2,
      maxX: pcbGroup.center.x + pcbGroup.width / 2,
      minY: pcbGroup.center.y - pcbGroup.height / 2,
      maxY: pcbGroup.center.y + pcbGroup.height / 2,
    }
    let solvedBreakoutPoints: readonly ImplicitBreakoutPointPlacement[]
    try {
      solvedBreakoutPoints = solveImplicitBreakoutPoints(
        this,
        implicitBreakoutPointSolverFn ?? defaultImplicitBreakoutPointSolverFn,
      )
    } catch (error) {
      if (
        implicitBreakoutPointSolverFn ||
        !reportWindingBreakoutInfeasibleError(this, error)
      ) {
        throw error
      }
      return
    }

    // The solver places breakout points exactly on the group boundary
    // (bounds.minX/maxX/minY/maxY). When the autorouter later builds a
    // quadtree mesh over the same bounds, repeated halving introduces
    // floating-point drift (≈4e-16) so a point exactly at the boundary
    // can fall outside the nearest mesh node. Nudge solved positions a
    // fraction of a micrometer inward to keep them strictly inside.
    const BOUNDARY_INSET_MM = 1e-4 // 0.1 μm – well below PCB manufacturing precision
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

    for (const solvedPoint of solvedBreakoutPoints) {
      const matchingBreakoutPoint = autoBreakoutPoints.find(
        (child) =>
          child.matchedPort?.source_port_id === solvedPoint.sourcePortId,
      )
      if (matchingBreakoutPoint) {
        const insetPoint = insetWithinBounds(solvedPoint.x, solvedPoint.y)
        matchingBreakoutPoint._applySolvedBreakoutPoint({
          sourceTraceId: solvedPoint.sourceTraceId,
          layer: solvedPoint.layer,
          position: insetPoint,
        })
      }
    }
  }

  doInitialPcbPrimitiveRender(): void {
    super.doInitialPcbPrimitiveRender()
  }

  doInitialPcbPlacementDesignRuleChecks(): void {
    Breakout_doInitialPcbPlacementDesignRuleChecks(this)
  }
}
