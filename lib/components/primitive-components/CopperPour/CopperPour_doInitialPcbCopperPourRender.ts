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

const renderAllCopperPoursForSubcircuit = async (subcircuit: ISubcircuit) => {
  if (!subcircuit.root) return

  const { db } = subcircuit.root
  const copperPours = subcircuit
    .selectAll<CopperPour>("copperpour")
    .filter((copperPour) => copperPour.getSubcircuit() === subcircuit)
  const resolvedCopperPours: Array<{
    copperPour: CopperPour
    sourceNetId: string
  }> = []

  for (const copperPour of copperPours) {
    const { _parsedProps: props } = copperPour
    const net = subcircuit.selectOne<Net>(props.connectsTo)
    const sourceNetId = net?.source_net_id
    if (!sourceNetId) {
      copperPour.renderError(
        `Net "${props.connectsTo}" not found for copper pour`,
      )
      continue
    }
    resolvedCopperPours.push({ copperPour, sourceNetId })
  }

  if (resolvedCopperPours.length === 0) return

  const circuitJson = db.toArray()
  const pcbBoard = circuitJson.find((element) => element.type === "pcb_board")
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
              thermal_relief_spoke_width: DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM,
            }
          : {}),
        outline: props.outline ?? resolvedPcbBoardOutline,
      }
    }),
  )

  await initializeManifoldGeometry()
  const solver = new CopperPourPipelineSolver(inputProblem)

  subcircuit.root.emit("solver:started", {
    type: "solver:started",
    solverName: "CopperPourPipelineSolver",
    solverParams: inputProblem,
    solverConstructorArgs: [inputProblem],
    componentName: subcircuit.getString(),
  })

  const { brep_shapes_by_region } = solver.getOutput()

  for (const [
    regionIndex,
    { copperPour, sourceNetId },
  ] of resolvedCopperPours.entries()) {
    const { _parsedProps: props } = copperPour
    const coveredWithSolderMask = props.coveredWithSolderMask ?? false

    for (const brepShape of brep_shapes_by_region[regionIndex] ?? []) {
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
    }
  }
}

export function CopperPour_doInitialPcbCopperPourRender(
  copperPour: CopperPour,
): void {
  if (copperPour.root?.pcbDisabled) return

  copperPour._queueAsyncEffect("PcbCopperPourRender", async () => {
    const subcircuit = copperPour.getSubcircuit()
    const pendingRender = pendingCopperPourRenders.get(subcircuit)
    if (pendingRender) {
      await pendingRender
      return
    }

    const renderPromise = renderAllCopperPoursForSubcircuit(subcircuit)
    pendingCopperPourRenders.set(subcircuit, renderPromise)
    try {
      await renderPromise
    } finally {
      pendingCopperPourRenders.delete(subcircuit)
    }
  })
}
