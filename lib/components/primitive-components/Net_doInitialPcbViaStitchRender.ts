import {
  initializeViaStitchSolver,
  ViaStitchSolver,
} from "@tscircuit/via-stitch-solver"
import type { ISubcircuit } from "./Group/Subcircuit/ISubcircuit"
import type { Net } from "./Net"
import { markTraceSegmentsInsideCopperPour } from "./CopperPour/utils/mark-trace-segments-inside-copper-pour"

const pendingViaStitchRenders = new WeakMap<ISubcircuit, Promise<void>>()
let initializeViaStitchSolverPromise: Promise<void> | undefined
const MINIMUM_VIA_STITCH_POWER_TRACE_WIDTH_MM = 0.5

const ensureViaStitchSolverInitialized = () => {
  initializeViaStitchSolverPromise ??= initializeViaStitchSolver()
  return initializeViaStitchSolverPromise
}

const renderViaStitchingForSubcircuit = async (subcircuit: ISubcircuit) => {
  if (!subcircuit.root) return

  const { db } = subcircuit.root
  const sourceNetIds = subcircuit
    .selectAll<Net>("net")
    .filter(
      (net) =>
        net.getSubcircuit() === subcircuit &&
        net._parsedProps.isPowerNet === true,
    )
    .flatMap((net) => (net.source_net_id ? [net.source_net_id] : []))

  if (sourceNetIds.length === 0 || db.pcb_board.list().length === 0) return

  const sourceNetIdSet = new Set(sourceNetIds)
  const thickPowerSourceTraceIds = new Set(
    db.source_trace
      .list()
      .filter(
        (sourceTrace) =>
          (sourceTrace.min_trace_thickness ?? 0) >=
            MINIMUM_VIA_STITCH_POWER_TRACE_WIDTH_MM &&
          sourceTrace.connected_source_net_ids.some((sourceNetId) =>
            sourceNetIdSet.has(sourceNetId),
          ),
      )
      .map((sourceTrace) => sourceTrace.source_trace_id),
  )
  const pcbTraceIds = db.pcb_trace
    .list()
    .filter(
      (pcbTrace) =>
        pcbTrace.source_trace_id !== undefined &&
        thickPowerSourceTraceIds.has(pcbTrace.source_trace_id),
    )
    .map((pcbTrace) => pcbTrace.pcb_trace_id)

  if (pcbTraceIds.length === 0) return

  await ensureViaStitchSolverInitialized()

  const solverInput = {
    circuitJson: db.toArray(),
    options: { sourceNetIds, pcbTraceIds },
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

  const output = solver.getOutput()
  for (const pcbCopperPour of output.pcbCopperPours) {
    const { pcb_copper_pour_id: _solverCopperPourId, ...copperPourInput } =
      pcbCopperPour
    const insertedCopperPour = db.pcb_copper_pour.insert(copperPourInput)
    markTraceSegmentsInsideCopperPour({
      db,
      copperPour: insertedCopperPour,
    })
  }
  for (const pcbVia of output.pcbVias) {
    const { pcb_via_id: _solverViaId, ...pcbViaInput } = pcbVia
    db.pcb_via.insert(pcbViaInput)
  }
}

export function Net_doInitialPcbViaStitchRender(net: Net): void {
  if (
    net.root?.pcbDisabled ||
    !net.source_net_id ||
    net._parsedProps.isPowerNet !== true
  )
    return

  net._queueAsyncEffect("PcbViaStitchRender", async () => {
    const subcircuit = net.getSubcircuit()
    const pendingRender = pendingViaStitchRenders.get(subcircuit)
    if (pendingRender) {
      await pendingRender
      return
    }

    const renderPromise = renderViaStitchingForSubcircuit(subcircuit)
    pendingViaStitchRenders.set(subcircuit, renderPromise)
    try {
      await renderPromise
    } finally {
      pendingViaStitchRenders.delete(subcircuit)
    }
  })
}
