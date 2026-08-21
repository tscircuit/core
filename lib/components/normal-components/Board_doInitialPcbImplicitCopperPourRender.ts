import { ImplicitCopperPourPipelineSolver } from "@tscircuit/implicit-copper-pour-solver/lib/index"
import type { Board } from "./Board"

export const Board_doInitialPcbImplicitCopperPourRender = (board: Board) => {
  const { root } = board
  if (!root || root.pcbDisabled) return
  if (root.pcbRoutingDisabled || board.getInheritedProperty("routingDisabled"))
    return

  const { db } = root
  const circuitJson = db
    .subtree({ subcircuit_id: board.subcircuit_id })
    .toArray()
  const hasPowerNet = circuitJson.some(
    (element) =>
      element.type === "source_net" &&
      (element.is_power ||
        element.is_ground ||
        element.is_positive_voltage_source),
  )
  if (!hasPowerNet) return

  const inputProblem = {
    circuitJson,
    layers: [...board.allLayers],
  }
  const solver = new ImplicitCopperPourPipelineSolver(inputProblem)
  const solverConstructorArgs = solver.getConstructorParams()

  root.emit("solver:started", {
    type: "solver:started",
    solverName: "ImplicitCopperPourPipelineSolver",
    solverParams: solverConstructorArgs[0],
    solverConstructorArgs,
    componentName: board.getString(),
  })

  solver.solve()
  db.insertAll(solver.getOutput())
}
