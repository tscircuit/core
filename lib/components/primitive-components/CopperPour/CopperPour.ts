import {
  CopperPourPipelineSolver,
  convertCircuitJsonToInputProblem,
  initializeManifoldGeometry,
} from "@tscircuit/copper-pour-solver"
import { type CopperPourProps, copperPourProps } from "@tscircuit/props"
import type { PcbCopperPour, SourceNet } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Net } from "../Net"
import { markTraceSegmentsInsideCopperPour } from "./utils/mark-trace-segments-inside-copper-pour"

export type { CopperPourProps }

export class CopperPour extends PrimitiveComponent<typeof copperPourProps> {
  isPcbPrimitive = true
  private static _manifoldGeometryInitialized = false
  private static _manifoldGeometryInitializationPromise: Promise<void> | null =
    null
  private static _manifoldGeometryInitializationError: string | null = null

  private static async _initializeManifoldGeometryOnce() {
    if (CopperPour._manifoldGeometryInitialized) return

    CopperPour._manifoldGeometryInitializationPromise ??=
      initializeManifoldGeometry()
        .then(() => {
          CopperPour._manifoldGeometryInitialized = true
          CopperPour._manifoldGeometryInitializationError = null
        })
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          CopperPour._manifoldGeometryInitialized = false
          CopperPour._manifoldGeometryInitializationPromise = null
          CopperPour._manifoldGeometryInitializationError = [
            "Copper pour rendering requires manifold-3d to be initialized before solving geometry.",
            `initializeManifoldGeometry() failed: ${errorMessage}`,
            "Install manifold-3d in the runtime environment and ensure your bundler/serverless deployment includes manifold-3d/lib/wasm.js and the manifold WASM asset.",
          ].join(" ")
          throw new Error(CopperPour._manifoldGeometryInitializationError, {
            cause: error,
          })
        })

    await CopperPour._manifoldGeometryInitializationPromise
  }

  get config() {
    return {
      componentName: "CopperPour",
      zodProps: copperPourProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    return { width: 0, height: 0 }
  }

  doInitialCreateNetsFromProps(): void {
    const { _parsedProps: props } = this
    createNetsFromProps(this, [props.connectsTo])
  }

  doInitialInitializeAsyncModules() {
    if (CopperPour._manifoldGeometryInitialized) return
    this._queueAsyncEffect("InitializeManifoldGeometry", async () => {
      try {
        await CopperPour._initializeManifoldGeometryOnce()
      } catch (error) {
        this.renderError({
          type: "pcb_placement_error",
          pcb_placement_error_id: `${this._renderId}_copper_pour_manifold_init_error`,
          error_type: "pcb_placement_error",
          message:
            CopperPour._manifoldGeometryInitializationError ??
            (error instanceof Error ? error.message : String(error)),
          subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
        })
      }
    })
  }

  doInitialPcbCopperPourRender() {
    if (this.root?.pcbDisabled) return
    this._queueAsyncEffect("PcbCopperPourRender", async () => {
      const { db } = this.root!
      const { _parsedProps: props } = this

      const net = this.getSubcircuit().selectOne(props.connectsTo) as Net | null
      if (!net || !net.source_net_id) {
        this.renderError(`Net "${props.connectsTo}" not found for copper pour`)
        return
      }
      const subcircuit = this.getSubcircuit()
      const circuitJson = db.toArray()
      const sourceNet = circuitJson.find(
        (elm) => elm.type === "source_net" && elm.name === net.name,
      ) as SourceNet | undefined

      const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)
      const connectedNetId = sourceNet?.source_net_id ?? net.source_net_id
      const pourConnectivityKey =
        (connectedNetId
          ? connectivityMap.getNetConnectedToId(connectedNetId)
          : undefined) ||
        sourceNet?.subcircuit_connectivity_map_key ||
        ""

      if (!CopperPour._manifoldGeometryInitialized) return

      const clearance = props.clearance ?? 0.2
      let inputProblem: ReturnType<typeof convertCircuitJsonToInputProblem>
      let solver: InstanceType<typeof CopperPourPipelineSolver>
      try {
        inputProblem = convertCircuitJsonToInputProblem(circuitJson, {
          layer: props.layer,
          pour_connectivity_key: pourConnectivityKey,
          pad_margin: props.padMargin ?? clearance,
          trace_margin: props.traceMargin ?? clearance,
          board_edge_margin: props.boardEdgeMargin ?? clearance,
          cutout_margin: props.cutoutMargin ?? clearance,
          outline: props.outline,
        })

        solver = new CopperPourPipelineSolver(inputProblem)
      } catch (error) {
        this.renderError({
          type: "pcb_placement_error",
          pcb_placement_error_id: `${this._renderId}_copper_pour_solver_prepare_error`,
          error_type: "pcb_placement_error",
          message: `Failed to prepare copper pour solver: ${
            error instanceof Error ? error.message : String(error)
          }`,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        })
        return
      }

      this.root!.emit("solver:started", {
        solverName: "CopperPourPipelineSolver",
        solverParams: inputProblem,
        componentName: this.props.name,
      })

      let brep_shapes: ReturnType<typeof solver.getOutput>["brep_shapes"]
      try {
        brep_shapes = solver.getOutput().brep_shapes
      } catch (error) {
        this.renderError({
          type: "pcb_placement_error",
          pcb_placement_error_id: `${this._renderId}_copper_pour_solver_output_error`,
          error_type: "pcb_placement_error",
          message: `Failed to solve copper pour geometry: ${
            error instanceof Error ? error.message : String(error)
          }`,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        })
        return
      }

      const coveredWithSolderMask = props.coveredWithSolderMask ?? false

      for (const brep_shape of brep_shapes) {
        const insertedPour = db.pcb_copper_pour.insert({
          shape: "brep",
          layer: props.layer,
          brep_shape,
          source_net_id: net.source_net_id,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          covered_with_solder_mask: coveredWithSolderMask,
        } as PcbCopperPour)

        markTraceSegmentsInsideCopperPour({
          db,
          copperPour: insertedPour,
        })
      }
    })
  }
}
