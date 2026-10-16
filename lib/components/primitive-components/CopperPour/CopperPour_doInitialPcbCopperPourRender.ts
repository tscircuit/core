import {
  CopperPourPipelineSolver,
  convertCircuitJsonToInputProblem,
  initializeManifoldGeometry,
} from "@tscircuit/copper-pour-solver"
import { ImplicitCopperPourPipelineSolver } from "@tscircuit/implicit-copper-pour-solver/lib/index"
import type { LayerRef, Point } from "circuit-json"
import type { ISubcircuit } from "../Group/Subcircuit/ISubcircuit"
import type { Net } from "../Net"
import type { CopperPour } from "./CopperPour"
import { markTraceSegmentsInsideCopperPour } from "./utils/mark-trace-segments-inside-copper-pour"

// Each CopperPour queues this phase, but the solver processes every pour in a
// subcircuit together. Share that batch across the component-owned effects.
const pendingCopperPourRenders = new WeakMap<ISubcircuit, Promise<void>>()
const DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM = 0.3

const getPolygonArea = (points: Point[] | undefined): number => {
  if (!points || points.length < 3) return Number.POSITIVE_INFINITY
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const curr = points[i]!
    const next = points[(i + 1) % points.length]!
    area += curr.x * next.y - next.x * curr.y
  }
  return Math.abs(area) / 2
}

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

  // When multiple full-board copper pours (no explicit outline) share a layer on
  // different nets, partition that layer among their nets so neither pour
  // silently consumes the whole board or shorts across nets.
  const fullBoardNetIdsByLayer = new Map<LayerRef, Set<string>>()
  for (const { copperPour, sourceNetId } of resolvedCopperPours) {
    const { _parsedProps: props } = copperPour
    if (props.outline || copperPour._isImplicitCopperPour) continue
    let netIds = fullBoardNetIdsByLayer.get(props.layer)
    if (!netIds) {
      netIds = new Set()
      fullBoardNetIdsByLayer.set(props.layer, netIds)
    }
    netIds.add(sourceNetId)
  }

  const partitionedOutlinesByLayerAndNet = new Map<LayerRef, Map<string, Point[][]>>()
  if (pcbBoard) {
    for (const [layer, netIds] of fullBoardNetIdsByLayer.entries()) {
      if (netIds.size < 2) continue
      const partitionCircuitJson = circuitJson.map((element) => {
        if (element.type !== "source_net") return element
        const isTargetNet = netIds.has(element.source_net_id)
        return {
          ...element,
          is_power: isTargetNet,
          is_ground: false,
          is_positive_voltage_source: false,
        }
      })
      const implicitSolver = new ImplicitCopperPourPipelineSolver({
        circuitJson: partitionCircuitJson,
        layers: [layer],
      })
      implicitSolver.solve()
      const outlinesByNet = new Map<string, Point[][]>()
      for (const region of implicitSolver.getOutput()) {
        if (
          region.shape !== "polygon" ||
          region.layer !== layer ||
          !region.source_net_id
        )
          continue
        const list = outlinesByNet.get(region.source_net_id) ?? []
        list.push(region.points)
        outlinesByNet.set(region.source_net_id, list)
      }
      if (outlinesByNet.size > 0) {
        partitionedOutlinesByLayerAndNet.set(layer, outlinesByNet)
      }
    }
  }

  const solverRegions: Array<{
    copperPour: CopperPour
    sourceNetId: string
    outline: Point[] | undefined
    useBoardEdgeOutline: boolean
    hasExplicitOutline: boolean
    area: number
  }> = []

  for (const { copperPour, sourceNetId } of resolvedCopperPours) {
    const { _parsedProps: props } = copperPour
    const partitionedOutlinesByNet =
      !props.outline && !copperPour._isImplicitCopperPour
        ? partitionedOutlinesByLayerAndNet.get(props.layer)
        : undefined

    if (partitionedOutlinesByNet) {
      const outlines = partitionedOutlinesByNet.get(sourceNetId) ?? []
      for (const outline of outlines) {
        solverRegions.push({
          copperPour,
          sourceNetId,
          outline,
          useBoardEdgeOutline: true,
          hasExplicitOutline: false,
          area: getPolygonArea(outline),
        })
      }
      continue
    }

    const outline = props.outline ?? resolvedPcbBoardOutline
    solverRegions.push({
      copperPour,
      sourceNetId,
      outline,
      useBoardEdgeOutline: Boolean(copperPour._isImplicitCopperPour),
      hasExplicitOutline: Boolean(props.outline),
      area: props.outline
        ? getPolygonArea(props.outline)
        : Number.POSITIVE_INFINITY,
    })
  }

  if (solverRegions.length === 0) return

  // CopperPourPipelineSolver gives higher priority to later regions. Ensure
  // explicit/smaller outlines are ordered after full-board/larger outlines on
  // the same layer so inset pours always carve out of encompassing pours.
  solverRegions.sort((a, b) => {
    if (a.hasExplicitOutline !== b.hasExplicitOutline) {
      return a.hasExplicitOutline ? 1 : -1
    }
    if (a.hasExplicitOutline && b.hasExplicitOutline && a.area !== b.area) {
      return b.area - a.area
    }
    return 0
  })

  // warningOnly affects routing and DRC severity; pours still avoid every keepout.
  const inputProblem = convertCircuitJsonToInputProblem(
    circuitJson,
    solverRegions.map(
      ({ copperPour, sourceNetId, outline, useBoardEdgeOutline }) => {
        const { _parsedProps: props } = copperPour
        const clearance = props.clearance ?? 0.2
        return {
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
          board_edge_outline: useBoardEdgeOutline
            ? resolvedPcbBoardOutline
            : undefined,
          cutout_margin: props.cutoutMargin ?? clearance,
          ...(props.useThermalReliefs
            ? {
                use_thermal_reliefs: true,
                thermal_relief_spoke_width: DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM,
              }
            : {}),
          outline,
        }
      },
    ),
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
  ] of solverRegions.entries()) {
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
