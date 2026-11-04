import {
  CopperPourPipelineSolver,
  initializeManifoldGeometry,
} from "@tscircuit/copper-pour-solver"
import type { ISubcircuit } from "../Group/Subcircuit/ISubcircuit"
import type { CopperPour } from "./CopperPour"
import {
  collectResolvedCopperPours,
  createCopperPourInputProblem,
} from "./create-copper-pour-input-problem"
import { markTraceSegmentsInsideCopperPour } from "./utils/mark-trace-segments-inside-copper-pour"

// Each CopperPour queues this phase, but the solver processes every pour in a
// subcircuit together. Share that batch across the component-owned effects.
const pendingCopperPourRenders = new WeakMap<ISubcircuit, Promise<void>>()

const insertCopperPoursForSubcircuit = async (subcircuit: ISubcircuit) => {
  if (!subcircuit.root) return

  const { db } = subcircuit.root
  const resolvedCopperPours = collectResolvedCopperPours(subcircuit, {
    reportMissingNet: true,
  })
  if (resolvedCopperPours.length === 0) return

  const circuitJson = db.toArray()
  const inputProblem = createCopperPourInputProblem(
    subcircuit,
    circuitJson,
    resolvedCopperPours,
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

const renderAllCopperPoursForSubcircuit = async (subcircuit: ISubcircuit) => {
  await insertCopperPoursForSubcircuit(subcircuit)

  // A signal route can cut the pour the autorouter treated as already
  // connected. Route that board once more without the hint, then fill again.
  const subcircuitWithRestore = subcircuit as ISubcircuit & {
    _restoreRoutingIfPourLeftPortsOpen?: () => Promise<boolean>
  }
  if (!subcircuitWithRestore._restoreRoutingIfPourLeftPortsOpen) return
  const restored =
    await subcircuitWithRestore._restoreRoutingIfPourLeftPortsOpen()
  if (restored) await insertCopperPoursForSubcircuit(subcircuit)
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
