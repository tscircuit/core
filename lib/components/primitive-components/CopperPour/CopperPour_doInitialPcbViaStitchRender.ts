import { ViaStitchSolver } from "@tscircuit/via-stitch-solver"
import { pcb_via } from "circuit-json"
import { getViaDiameterDefaults } from "lib/utils/pcbStyle/getViaDiameterDefaults"
import { getViaTenting } from "lib/utils/getViaTenting"
import type { Net } from "../Net"
import type { CopperPour } from "./CopperPour"

const renderViaStitchingForCopperPours = (copperPour: CopperPour) => {
  const subcircuit = copperPour.getSubcircuit()
  if (!subcircuit.root) return

  const copperPours = subcircuit
    .selectAll<CopperPour>("copperpour")
    .filter(
      (candidateCopperPour) =>
        candidateCopperPour.getSubcircuit() === subcircuit,
    )
  if (copperPours[0] !== copperPour) return

  const sourceNetIds = copperPours.flatMap((candidateCopperPour) => {
    const net = subcircuit.selectOne<Net>(
      candidateCopperPour._parsedProps.connectsTo,
    )
    return net?.source_net_id ? [net.source_net_id] : []
  })
  if (sourceNetIds.length === 0) return

  const { db } = subcircuit.root
  const pcbStyle = copperPour.getInheritedMergedProperty("pcbStyle")
  const { holeDiameter, padDiameter } = getViaDiameterDefaults(pcbStyle)
  const boardComponent = copperPour._getBoard()
  const pcbBoard = boardComponent?.pcb_board_id
    ? db.pcb_board.get(boardComponent.pcb_board_id)
    : undefined
  const solverInput = {
    circuitJson: db.toArray(),
    options: {
      sourceNetIds: [...new Set(sourceNetIds)],
      viaHoleDiameter: pcbBoard?.min_via_hole_diameter ?? holeDiameter,
      viaOuterDiameter: pcbBoard?.min_via_pad_diameter ?? padDiameter,
    },
  }
  const solver = new ViaStitchSolver(solverInput)

  subcircuit.root.emit("solver:started", {
    type: "solver:started",
    solverName: "ViaStitchSolver",
    solverParams: solverInput,
    solverConstructorArgs: [solverInput],
    componentName: subcircuit.getString(),
  })

  solver.solve()
  if (solver.failed) {
    throw new Error(solver.error ?? "Via stitching solver failed")
  }

  const boardTenting = getViaTenting(
    boardComponent?._parsedProps.defaultViaTenting,
  )
  for (const pcbVia of solver.getOutput().pcbVias) {
    const { pcb_via_id: _solverViaId, ...pcbViaInput } = pcb_via.parse(pcbVia)
    const insertedVia = db.pcb_via.insert({
      ...pcbViaInput,
      tented_on_top: boardTenting.tented_on_top ?? pcbViaInput.tented_on_top,
      tented_on_bottom:
        boardTenting.tented_on_bottom ?? pcbViaInput.tented_on_bottom,
    })
    boardComponent?._generatedStitchingViaIds?.add(insertedVia.pcb_via_id)
  }
}

export function CopperPour_doInitialPcbViaStitchRender(
  copperPour: CopperPour,
): void {
  if (copperPour.root?.pcbDisabled || !copperPour.root?._featurePcbViaStitching)
    return

  copperPour._queueAsyncEffect("PcbViaStitchRender", async () => {
    renderViaStitchingForCopperPours(copperPour)
  })
}
