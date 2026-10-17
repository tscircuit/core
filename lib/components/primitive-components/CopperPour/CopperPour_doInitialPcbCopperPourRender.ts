import Flatten from "@flatten-js/core"
import {
  CopperPourPipelineSolver,
  convertCircuitJsonToInputProblem,
  initializeManifoldGeometry,
} from "@tscircuit/copper-pour-solver"
import type { Point } from "circuit-json"
import type { ISubcircuit } from "../Group/Subcircuit/ISubcircuit"
import type { Net } from "../Net"
import type { CopperPour } from "./CopperPour"
import { markTraceSegmentsInsideCopperPour } from "./utils/mark-trace-segments-inside-copper-pour"

// Each CopperPour queues this phase, but the solver processes every pour in a
// subcircuit together. Share that batch across the component-owned effects.
const pendingCopperPourRenders = new WeakMap<ISubcircuit, Promise<void>>()
const DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM = 0.3
const POINT_EPSILON = 1e-6

const normalizeRingPoints = (points: Point[]): Point[] => {
  const deduped: Point[] = []
  for (const pt of points) {
    const prev = deduped[deduped.length - 1]
    if (!prev || Math.hypot(pt.x - prev.x, pt.y - prev.y) > POINT_EPSILON) {
      deduped.push(pt)
    }
  }
  if (deduped.length > 1) {
    const first = deduped[0]!
    const last = deduped[deduped.length - 1]!
    if (Math.hypot(first.x - last.x, first.y - last.y) <= POINT_EPSILON) {
      deduped.pop()
    }
  }
  return deduped
}

const createCcwPolygon = (points: Point[]): Flatten.Polygon | null => {
  const ring = normalizeRingPoints(points)
  if (ring.length < 3) return null
  const polygon = new Flatten.Polygon(
    ring.map(({ x, y }) => Flatten.point(x, y)),
  )
  if (polygon.orientation() === Flatten.ORIENTATION.CW) {
    polygon.reverse()
  }
  return polygon
}

const clipCopperPourOutlineToBoard = (
  pourOutline: Point[],
  boardOutline?: Point[],
): Point[][] => {
  if (!boardOutline || boardOutline.length < 3) {
    return [pourOutline]
  }
  const pourPolygon = createCcwPolygon(pourOutline)
  const boardPolygon = createCcwPolygon(boardOutline)
  if (!pourPolygon || !boardPolygon) {
    return [pourOutline]
  }
  if (boardPolygon.contains(pourPolygon)) {
    return [pourOutline]
  }
  try {
    const clipped = Flatten.BooleanOperations.intersect(
      pourPolygon,
      boardPolygon,
    )
    const clippedOutlines = clipped
      .splitToIslands()
      .map((island) => {
        const faces = ([...island.faces] as Flatten.Face[]).sort(
          (a, b) => b.area() - a.area(),
        )
        const outerFace = faces[0]
        return outerFace ? outerFace.vertices.map(({ x, y }) => ({ x, y })) : []
      })
      .filter((ring) => ring.length >= 3)

    return clippedOutlines
  } catch {
    return [pourOutline]
  }
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

  const expandedPourRegions = resolvedCopperPours.flatMap(
    ({ copperPour, sourceNetId }) => {
      const { _parsedProps: props } = copperPour
      if (!props.outline) {
        return [{ copperPour, sourceNetId, outline: resolvedPcbBoardOutline }]
      }
      const clippedOutlines = clipCopperPourOutlineToBoard(
        props.outline,
        resolvedPcbBoardOutline,
      )
      return clippedOutlines.map((outline) => ({
        copperPour,
        sourceNetId,
        outline,
      }))
    },
  )

  if (expandedPourRegions.length === 0) return

  // warningOnly affects routing and DRC severity; pours still avoid every keepout.
  const inputProblem = convertCircuitJsonToInputProblem(
    circuitJson,
    expandedPourRegions.map(({ copperPour, sourceNetId, outline }) => {
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
        outline,
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
  ] of expandedPourRegions.entries()) {
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
