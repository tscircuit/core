import { ImplicitCopperPourPipelineSolver } from "@tscircuit/implicit-copper-pour-solver/lib/index"
import { CopperPour } from "../primitive-components/CopperPour"
import type { Net } from "../primitive-components/Net"
import type { Board } from "./Board"

export const Board_doInitialPcbImplicitCopperPourRender = (board: Board) => {
  const { root } = board
  if (!root || root.pcbDisabled) return
  if (!board._parsedProps.automaticPoursEnabled) return
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
  const boardNets = board.selectAll<Net>("net")
  for (const implicitRegion of solver.getOutput()) {
    if (implicitRegion.shape !== "polygon") continue
    const owningNet = boardNets.find(
      (net) => net.source_net_id === implicitRegion.source_net_id,
    )
    if (!owningNet) {
      throw new Error(
        `Unable to find the power net for implicit copper region ${implicitRegion.pcb_copper_pour_id}`,
      )
    }

    const copperPour = new CopperPour({
      layer: implicitRegion.layer,
      connectsTo: owningNet.getPortSelector(),
      outline: implicitRegion.points,
      coveredWithSolderMask: implicitRegion.covered_with_solder_mask,
    })
    copperPour._isImplicitCopperPour = true
    owningNet.getSubcircuit().add(copperPour)
  }
}
