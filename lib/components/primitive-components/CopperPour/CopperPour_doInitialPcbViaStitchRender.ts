import * as Effect from "effect/Effect"
import { coreSync } from "lib/effect/core-error"
import type { CoreJobContext } from "lib/effect/core-services"
import { ViaStitchSolver } from "@tscircuit/via-stitch-solver"
import { pcb_via } from "circuit-json"
import { getViaDiameterDefaults } from "lib/utils/pcbStyle/getViaDiameterDefaults"
import type { Net } from "../Net"
import type { CopperPour } from "./CopperPour"

const renderViaStitchingForCopperPours = (
  copperPour: CopperPour,
  job: CoreJobContext,
) =>
  Effect.gen(function* () {
    const subcircuit = copperPour.getSubcircuit()
    if (!subcircuit.root) return

    const copperPours = subcircuit
      .selectAll<CopperPour>("copperpour")
      .filter(
        (candidateCopperPour) =>
          candidateCopperPour.getSubcircuit() === subcircuit &&
          !candidateCopperPour.shouldBeRemoved,
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
        viaStitchPitch: boardComponent?._parsedProps.viaStitchPitch,
      },
    }
    const solver = yield* coreSync(
      () => new ViaStitchSolver(solverInput),
      "create_via_stitch_solver",
    )

    job.commit(() =>
      subcircuit.root?.emit("solver:started", {
        type: "solver:started",
        solverName: "ViaStitchSolver",
        solverParams: solverInput,
        solverConstructorArgs: [solverInput],
        componentName: subcircuit.getString(),
      }),
    )

    yield* coreSync(() => solver.solve(), "solve_via_stitching")
    if (solver.failed) {
      throw new Error(solver.error ?? "Via stitching solver failed")
    }

    for (const pcbVia of solver.getOutput().pcbVias) {
      const { pcb_via_id: _solverViaId, ...pcbViaInput } = pcb_via.parse(pcbVia)
      yield* coreSync(
        () =>
          job.commit(() => {
            const insertedVia = db.pcb_via.insert({
              ...pcbViaInput,
              tented_on_top: undefined,
              tented_on_bottom: undefined,
            })
            boardComponent?._generatedStitchingViaIds?.add(
              insertedVia.pcb_via_id,
            )
          }),
        "commit_stitching_via",
      )
    }
  })

export function CopperPour_doInitialPcbViaStitchRender(
  copperPour: CopperPour,
): void {
  if (copperPour.root?.pcbDisabled || !copperPour.root?._featurePcbViaStitching)
    return
  if (!copperPour._getBoard()?._parsedProps.enableViaStitching) return

  copperPour._queueEffect(
    "PcbViaStitchRender",
    (job) => renderViaStitchingForCopperPours(copperPour, job),
    // Initial-only work retains the baseline's finish-on-props-change behavior.
    { propsChange: "finish" },
  )
}
