import {
  CopperPourPipelineSolver,
  convertCircuitJsonToInputProblem,
  initializeManifoldGeometry,
} from "@tscircuit/copper-pour-solver"
import type { ISubcircuit } from "../Group/Subcircuit/ISubcircuit"
import type { Net } from "../Net"
import type { CopperPour } from "./CopperPour"
import { markTraceSegmentsInsideCopperPour } from "./utils/mark-trace-segments-inside-copper-pour"

// Each CopperPour queues this phase, but the solver processes every pour on a
// board together, including pours in nested subcircuits, so different-net pours
// keep their clearance from each other. Share that batch across the effects.
const pendingCopperPourRenders = new WeakMap<ISubcircuit, Promise<void>>()
// Pours already inserted; a pour whose effect starts after its board's batch
// finished is solved against them without inserting them again.
const renderedCopperPours = new WeakSet<CopperPour>()

const getCopperPourBatchOwner = (copperPour: CopperPour): ISubcircuit =>
  (copperPour._getBoard() as ISubcircuit | undefined) ??
  copperPour.getSubcircuit()
const DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM = 0.3

const renderAllCopperPoursForBoard = async (subcircuit: ISubcircuit) => {
  if (!subcircuit.root) return

  const { db } = subcircuit.root
  const copperPours = subcircuit
    .getDescendants()
    .filter(
      (component): component is CopperPour =>
        component.componentName === "CopperPour" &&
        getCopperPourBatchOwner(component as CopperPour) === subcircuit,
    )
  // The solver gives later regions priority where different-net pours meet. A
  // pour in a nested subcircuit wins over its parents' pours, and pours already
  // rendered keep their copper when a pour arrives late.
  const getPriority = (copperPour: CopperPour) => {
    if (renderedCopperPours.has(copperPour)) return Number.MAX_SAFE_INTEGER
    let depth = 0
    for (let parent = copperPour.parent; parent; parent = parent.parent) {
      if (parent.isSubcircuit) depth++
    }
    return depth
  }
  copperPours.sort((a, b) => getPriority(a) - getPriority(b))

  const resolvedCopperPours: Array<{
    copperPour: CopperPour
    sourceNetId: string
    isNew: boolean
  }> = []
  // A pour with a bad connectsTo must not stop the board's other pours.
  const renderErrors: unknown[] = []

  for (const copperPour of copperPours) {
    const isNew = !renderedCopperPours.has(copperPour)
    renderedCopperPours.add(copperPour)
    const { _parsedProps: props } = copperPour
    let sourceNetId: string | undefined
    try {
      sourceNetId = copperPour
        .getSubcircuit()
        .selectOne<Net>(props.connectsTo)?.source_net_id
      if (!sourceNetId) {
        throw new Error(`Net "${props.connectsTo}" not found for copper pour`)
      }
    } catch (error) {
      if (isNew) renderErrors.push(error)
      continue
    }
    resolvedCopperPours.push({ copperPour, sourceNetId, isNew })
  }

  if (!resolvedCopperPours.some(({ isNew }) => isNew)) {
    if (renderErrors.length > 0) throw renderErrors[0]
    return
  }

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
        pcb_board_id: pcbBoard?.pcb_board_id,
        layer: props.layer,
        crosshatch: props.crosshatch,
        crosshatchPitch: props.crosshatchPitch,
        crosshatchWidth: props.crosshatchWidth,
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
    { copperPour, sourceNetId, isNew },
  ] of resolvedCopperPours.entries()) {
    if (!isNew) continue
    const { _parsedProps: props } = copperPour
    // Soldermask only exists on the top and bottom layers, so an inner-layer
    // pour is never covered with soldermask.
    const isOuterLayer = props.layer === "top" || props.layer === "bottom"
    const coveredWithSolderMask = isOuterLayer
      ? (props.coveredWithSolderMask ?? false)
      : false

    for (const brepShape of brep_shapes_by_region[regionIndex] ?? []) {
      const insertedPour = db.pcb_copper_pour.insert({
        shape: "brep",
        layer: props.layer,
        brep_shape: brepShape,
        source_net_id: sourceNetId,
        subcircuit_id: copperPour.getSubcircuit().subcircuit_id ?? undefined,
        covered_with_solder_mask: coveredWithSolderMask,
      })

      markTraceSegmentsInsideCopperPour({
        db,
        copperPour: insertedPour,
      })
    }
  }

  if (renderErrors.length > 0) throw renderErrors[0]
}

export function CopperPour_doInitialPcbCopperPourRender(
  copperPour: CopperPour,
): void {
  if (copperPour.root?.pcbDisabled) return

  copperPour._queueAsyncEffect("PcbCopperPourRender", async () => {
    const subcircuit = getCopperPourBatchOwner(copperPour)
    const pendingRender = pendingCopperPourRenders.get(subcircuit)
    if (pendingRender) {
      await pendingRender
      return
    }

    const renderPromise = renderAllCopperPoursForBoard(subcircuit)
    pendingCopperPourRenders.set(subcircuit, renderPromise)
    try {
      await renderPromise
    } finally {
      pendingCopperPourRenders.delete(subcircuit)
    }
  })
}
