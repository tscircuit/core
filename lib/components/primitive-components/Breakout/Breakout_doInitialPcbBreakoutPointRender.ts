import { BreakoutPointSolver } from "@tscircuit/breakout-point-solver"
import Debug from "debug"
import type { Breakout } from "./Breakout"
import { applyBreakoutPointSolverOutput } from "./applyBreakoutPointSolverOutput"
import { createBreakoutPointSolverInput } from "./createBreakoutPointSolverInput"

const debug = Debug("tscircuit:core:breakout-point-solver")

export const Breakout_doInitialPcbBreakoutPointRender = (
  breakout: Breakout,
) => {
  if (breakout.root?.pcbDisabled) return
  if (!breakout.pcb_group_id) return

  const input = createBreakoutPointSolverInput(breakout)
  if (!input || input.traces.length === 0) return

  if (debug.enabled) {
    breakout.root?.emit("debug:logOutput", {
      type: "debug:logOutput",
      name: "breakout-point-solver-input",
      content: JSON.stringify(input, null, 2),
    })
  }

  const solver = new BreakoutPointSolver(input)
  solver.solve()

  const output = solver.getOutput()
  if (output.breakoutPoints.length === 0) return

  applyBreakoutPointSolverOutput({ breakout, output })
}
