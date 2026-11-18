import {
  CopperPourPipelineSolver,
  convertCircuitJsonToInputProblem,
  initializeManifoldGeometry,
} from "@tscircuit/copper-pour-solver"
import type { PcbCopperPour, PcbTrace } from "circuit-json"
import type { ISubcircuit } from "../Group/Subcircuit/ISubcircuit"
import type { Net } from "../Net"
import type { CopperPour } from "./CopperPour"
import { markTraceSegmentsInsideCopperPour } from "./utils/mark-trace-segments-inside-copper-pour"

// Each CopperPour queues this phase, but the solver processes every pour in a
// subcircuit together. Share that batch across the component-owned effects.
const pendingCopperPourRenders = new WeakMap<ISubcircuit, Promise<void>>()
const previewCopperPours = new WeakMap<ISubcircuit, PcbCopperPour[]>()
const DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM = 0.3

type CopperPourRenderMode = "preview" | "final"
type PcbCopperPourId = PcbCopperPour["pcb_copper_pour_id"]

const removePreviewPourReferences = (
  trace: PcbTrace,
  previewPourIds: Set<PcbCopperPourId>,
): PcbTrace => {
  if (
    !trace.route.some(
      (point) =>
        "copper_pour_id" in point &&
        point.copper_pour_id &&
        previewPourIds.has(point.copper_pour_id),
    )
  )
    return trace

  return {
    ...trace,
    route: trace.route.map((point) => {
      if (
        !("copper_pour_id" in point) ||
        !point.copper_pour_id ||
        !previewPourIds.has(point.copper_pour_id)
      )
        return point
      const { copper_pour_id, is_inside_copper_pour, ...wireOrVia } = point
      return wireOrVia
    }),
  }
}

const renderAllCopperPoursForSubcircuit = async (
  subcircuit: ISubcircuit,
  mode: CopperPourRenderMode,
) => {
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

  const previewPours = previewCopperPours.get(subcircuit) ?? []
  const previewPourIds = new Set(
    previewPours.map((pour) => pour.pcb_copper_pour_id),
  )
  // Rebuild from routed copper without provisional pours or their annotations.
  const circuitJson = db
    .toArray()
    .filter(
      (circuitElement) =>
        circuitElement.type !== "pcb_copper_pour" ||
        !previewPourIds.has(circuitElement.pcb_copper_pour_id),
    )
    .map((circuitElement) => {
      if (circuitElement.type !== "pcb_trace") return circuitElement
      return removePreviewPourReferences(circuitElement, previewPourIds)
    })
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

  // Keep the preview until replacement geometry is ready, including on failure.
  for (const pour of previewPours) {
    db.pcb_copper_pour.delete(pour.pcb_copper_pour_id)
  }
  for (const trace of db.pcb_trace.list()) {
    const updatedTrace = removePreviewPourReferences(trace, previewPourIds)
    if (updatedTrace !== trace) {
      db.pcb_trace.update(trace.pcb_trace_id, { route: updatedTrace.route })
    }
  }
  previewCopperPours.delete(subcircuit)
  const renderedPreviewPours: PcbCopperPour[] = []
  if (mode === "preview") {
    previewCopperPours.set(subcircuit, renderedPreviewPours)
  }

  for (const [
    regionIndex,
    { copperPour, sourceNetId },
  ] of resolvedCopperPours.entries()) {
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
        subcircuit_id: subcircuit.subcircuit_id ?? undefined,
        covered_with_solder_mask: coveredWithSolderMask,
      })
      if (mode === "preview") renderedPreviewPours.push(insertedPour)

      markTraceSegmentsInsideCopperPour({
        db,
        copperPour: insertedPour,
      })
    }
  }
}

export function CopperPour_doInitialPcbCopperPourRender(
  copperPour: CopperPour,
  mode: CopperPourRenderMode = "final",
): void {
  if (copperPour.root?.pcbDisabled) return

  const effectName =
    mode === "preview" ? "PcbCopperPourPreviewRender" : "PcbCopperPourRender"
  copperPour._queueAsyncEffect(effectName, async () => {
    const subcircuit = copperPour.getSubcircuit()
    const pendingRender = pendingCopperPourRenders.get(subcircuit)
    if (pendingRender) {
      await pendingRender
      return
    }

    const renderPromise = renderAllCopperPoursForSubcircuit(subcircuit, mode)
    pendingCopperPourRenders.set(subcircuit, renderPromise)
    try {
      await renderPromise
    } finally {
      pendingCopperPourRenders.delete(subcircuit)
    }
  })
}
