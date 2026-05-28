import { breakoutProps } from "@tscircuit/props"
import { Group } from "../Group/Group"
import type { z } from "zod"
import { BreakoutPointSolver } from "@tscircuit/breakout-point-solver"
import { BreakoutPoint } from "../BreakoutPoint"
import { createBreakoutPointSolverInput } from "./createBreakoutPointSolverInput"

export class Breakout extends Group<typeof breakoutProps> {
  _hasGeneratedAutoBreakoutPoints = false

  constructor(props: z.input<typeof breakoutProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  doInitialPcbPrimitiveRender(): void {
    super.doInitialPcbPrimitiveRender()
  }

  doInitialPcbAutoBreakoutPointRender(): void {
    if (this.root?.pcbDisabled) return
    if (this._hasGeneratedAutoBreakoutPoints) return

    const props = this._parsedProps as z.infer<typeof breakoutProps>
    if (!props.autorouter) return

    const inputProblem = createBreakoutPointSolverInput(this)
    if (!inputProblem) return

    const solver = new BreakoutPointSolver(inputProblem)
    this.root?.emit("solver:started", {
      type: "solver:started",
      solverName: "BreakoutPointSolver",
      solverParams: solver.getConstructorParams(),
      componentName: this.getString(),
    })
    solver.solve()

    const manualBreakoutKeys = new Set(
      this.children
        .filter(
          (child): child is BreakoutPoint =>
            child instanceof BreakoutPoint && !child.hasResolvedTarget(),
        )
        .map((child) => {
          const sourcePortId = child.matchedPort?.source_port_id
          const sourceTraceId = sourcePortId
            ? child._getSourceTraceIdForPort(child.matchedPort!)
            : undefined
          return sourcePortId && sourceTraceId
            ? `${sourcePortId}:${sourceTraceId}`
            : null
        })
        .filter((key): key is string => Boolean(key)),
    )

    for (const point of solver.getOutput().breakoutPoints) {
      const pointKey = `${point.sourcePortId}:${point.sourceTraceId}`
      if (manualBreakoutKeys.has(pointKey)) continue

      const breakoutPoint = new BreakoutPoint({
        connection: point.sourcePortId,
        pcbX: point.x,
        pcbY: point.y,
      })
      breakoutPoint.setResolvedTarget({
        sourcePortId: point.sourcePortId,
        sourceTraceId: point.sourceTraceId,
        x: point.x,
        y: point.y,
        layer: point.layer,
      })
      this.add(breakoutPoint)
    }

    this._hasGeneratedAutoBreakoutPoints = true
  }
}
