import { ViaStitchSolver } from "@tscircuit/via-stitch-solver"
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
  const solverInput = {
    circuitJson: db.toArray(),
    options: { sourceNetIds: [...new Set(sourceNetIds)] },
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

  for (const pcbVia of solver.getOutput().pcbVias) {
    const { pcb_via_id: _solverViaId, ...pcbViaInput } = pcbVia
    db.pcb_via.insert(pcbViaInput)
  }
}

export function CopperPour_doInitialPcbViaStitchRender(
  copperPour: CopperPour,
): void {
  if (copperPour.root?.pcbDisabled) return

  copperPour._queueAsyncEffect("PcbViaStitchRender", async () => {
    renderViaStitchingForCopperPours(copperPour)
  })
}
