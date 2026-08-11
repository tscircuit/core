import {
  CopperPourPipelineSolver,
  convertCircuitJsonToInputProblem,
  initializeManifoldGeometry,
} from "@tscircuit/copper-pour-solver"
import type { PcbCopperPour } from "circuit-json"
import type { ISubcircuit } from "../../Group/Subcircuit/ISubcircuit"
import type { Net } from "../../Net"
import type { CopperPour } from "../CopperPour"
import { markTraceSegmentsInsideCopperPour } from "./mark-trace-segments-inside-copper-pour"

// Each CopperPour owns its render effect, while pours in the same subcircuit
// share the single batch solve needed for pour-to-pour clearance.
const pendingCopperPourRenders = new WeakMap<ISubcircuit, Promise<void>>()

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
    const net = subcircuit.selectOne(props.connectsTo) as Net | null
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
        cutout_margin: props.cutoutMargin ?? clearance,
        outline: props.outline,
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
      } as PcbCopperPour)

      markTraceSegmentsInsideCopperPour({
        db,
        copperPour: insertedPour,
      })
    }
  }
}

export const renderCopperPoursForSubcircuit = (
  copperPour: CopperPour,
): Promise<void> => {
  const subcircuit = copperPour.getSubcircuit()
  const pendingRender = pendingCopperPourRenders.get(subcircuit)
  if (pendingRender) return pendingRender

  const renderPromise = renderAllCopperPoursForSubcircuit(subcircuit).finally(
    () => pendingCopperPourRenders.delete(subcircuit),
  )
  pendingCopperPourRenders.set(subcircuit, renderPromise)
  return renderPromise
}
