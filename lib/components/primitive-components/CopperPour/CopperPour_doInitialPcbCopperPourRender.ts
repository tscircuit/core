import * as Effect from "effect/Effect"
import { corePromise, coreSync } from "lib/effect/core-error"
import type { CoreJobContext } from "lib/effect/core-services"
import { isActiveRoutingDescendant } from "lib/effect/routing-owner-active"
import {
  CopperPourPipelineSolver,
  convertCircuitJsonToInputProblem,
  initializeManifoldGeometry,
} from "@tscircuit/copper-pour-solver"
import type { ISubcircuit } from "../Group/Subcircuit/ISubcircuit"
import type { Net } from "../Net"
import type { CopperPour } from "./CopperPour"
import { markTraceSegmentsInsideCopperPour } from "./utils/mark-trace-segments-inside-copper-pour"

// Each CopperPour queues this phase, but the solver processes every pour in a
// subcircuit together. Share that batch across the component-owned effects.
const pendingCopperPourRenders = new WeakMap<ISubcircuit, Promise<void>>()
const DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM = 0.3

const renderAllCopperPoursForSubcircuit = (
  subcircuit: ISubcircuit,
  job: CoreJobContext,
) =>
  Effect.gen(function* () {
    if (!subcircuit.root || !job.isCurrent()) return

    const { db } = subcircuit.root
    const copperPours = subcircuit.selectAll<CopperPour>("copperpour").filter(
      (copperPour) =>
        copperPour.getSubcircuit() === subcircuit &&
        isActiveRoutingDescendant({
          descendant: copperPour,
          ancestor: subcircuit,
        }),
    )
    const resolvedCopperPours: Array<{
      copperPour: CopperPour
      sourceNetId: string
    }> = []

    for (const copperPour of copperPours) {
      const { _parsedProps: props } = copperPour
      const net = subcircuit.selectOne<Net>(props.connectsTo)
      const sourceNetId = net?.source_net_id
      if (!sourceNetId) {
        yield* coreSync(
          () =>
            job.commit(() =>
              copperPour.renderError(
                `Net "${props.connectsTo}" not found for copper pour`,
              ),
            ),
          "resolve_copper_pour_net",
        )
        continue
      }
      resolvedCopperPours.push({ copperPour, sourceNetId })
    }

    if (resolvedCopperPours.length === 0) return

    const circuitJson = db.toArray()
    const boardComponent = subcircuit._getBoard()
    const pcbBoard = boardComponent?.pcb_board_id
      ? db.pcb_board.get(boardComponent.pcb_board_id)
      : undefined
    let resolvedPcbBoardOutline = pcbBoard?.outline?.length
      ? pcbBoard.outline
      : undefined
    if (
      !resolvedPcbBoardOutline &&
      pcbBoard?.width !== undefined &&
      pcbBoard.height !== undefined
    ) {
      const { center, width, height } = pcbBoard
      resolvedPcbBoardOutline = [
        { x: center.x - width / 2, y: center.y - height / 2 },
        { x: center.x + width / 2, y: center.y - height / 2 },
        { x: center.x + width / 2, y: center.y + height / 2 },
        { x: center.x - width / 2, y: center.y + height / 2 },
      ]
    }
    // warningOnly affects routing and DRC severity; pours still avoid every keepout.
    const inputProblem = convertCircuitJsonToInputProblem(
      circuitJson,
      resolvedCopperPours.map(({ copperPour, sourceNetId }) => {
        const { _parsedProps: props } = copperPour
        const clearance = props.clearance ?? 0.2
        return {
          layer: props.layer,
          subcircuit_id: subcircuit.subcircuit_id ?? undefined,
          source_net_id: sourceNetId,
          pad_margin: props.padMargin ?? clearance,
          trace_margin: props.traceMargin ?? clearance,
          pour_margin: clearance,
          board_edge_margin: props.boardEdgeMargin ?? clearance,
          board_edge_outline: copperPour._isImplicitCopperPour
            ? resolvedPcbBoardOutline
            : undefined,
          cutout_margin: props.cutoutMargin ?? clearance,
          ...(props.useThermalReliefs
            ? {
                use_thermal_reliefs: true,
                thermal_relief_spoke_width:
                  DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM,
              }
            : {}),
          outline: props.outline ?? resolvedPcbBoardOutline,
        }
      }),
    )

    yield* corePromise(
      () => initializeManifoldGeometry(),
      "initialize_copper_pour_geometry",
    )
    const solver = yield* coreSync(
      () => new CopperPourPipelineSolver(inputProblem),
      "create_copper_pour_solver",
    )

    job.commit(() =>
      subcircuit.root?.emit("solver:started", {
        type: "solver:started",
        solverName: "CopperPourPipelineSolver",
        solverParams: inputProblem,
        solverConstructorArgs: [inputProblem],
        componentName: subcircuit.getString(),
      }),
    )

    const { brep_shapes_by_region } = yield* coreSync(
      () => solver.getOutput(),
      "solve_copper_pours",
    )

    for (const [
      regionIndex,
      { copperPour, sourceNetId },
    ] of resolvedCopperPours.entries()) {
      if (
        !isActiveRoutingDescendant({
          descendant: copperPour,
          ancestor: subcircuit,
        })
      )
        continue
      const { _parsedProps: props } = copperPour
      const coveredWithSolderMask = props.coveredWithSolderMask ?? false

      for (const brepShape of brep_shapes_by_region[regionIndex] ?? []) {
        yield* coreSync(
          () =>
            job.commit(() => {
              if (
                !isActiveRoutingDescendant({
                  descendant: copperPour,
                  ancestor: subcircuit,
                })
              )
                return
              const insertedPour = db.pcb_copper_pour.insert({
                shape: "brep",
                layer: props.layer,
                brep_shape: brepShape,
                source_net_id: sourceNetId,
                subcircuit_id: subcircuit.subcircuit_id ?? undefined,
                covered_with_solder_mask: coveredWithSolderMask,
              })

              markTraceSegmentsInsideCopperPour({
                db,
                copperPour: insertedPour,
              })
            }),
          "commit_copper_pour",
        )
      }
    }
  })

export function CopperPour_doInitialPcbCopperPourRender(
  copperPour: CopperPour,
): void {
  if (copperPour.root?.pcbDisabled) return

  copperPour._queueEffect(
    "PcbCopperPourRender",
    () =>
      Effect.gen(function* () {
        const subcircuit = copperPour.getSubcircuit()
        let pendingRender = pendingCopperPourRenders.get(subcircuit)
        if (!pendingRender) {
          const root = subcircuit.root
          if (!root) return
          // The subcircuit owns the batch. Removing one pour cancels its waiter,
          // while the surviving pours still receive their guarded output.
          pendingRender = root.effectRuntime.queue({
            owner: subcircuit,
            build: (job) => renderAllCopperPoursForSubcircuit(subcircuit, job),
            policy: { propsChange: "finish" },
          })
          pendingCopperPourRenders.set(subcircuit, pendingRender)
          const clearPendingRender = () => {
            if (pendingCopperPourRenders.get(subcircuit) === pendingRender) {
              pendingCopperPourRenders.delete(subcircuit)
            }
          }
          pendingRender.then(clearPendingRender, clearPendingRender)
        }
        yield* corePromise(() => pendingRender!, "await_copper_pour_batch")
      }),
    // A props update does not cancel baseline pour work or its shared waiter.
    { propsChange: "finish" },
  )
}
