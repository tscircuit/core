import { copperPourProps, type CopperPourProps } from "@tscircuit/props"
import {
  CopperPourPipelineSolver,
  convertCircuitJsonToInputProblem,
} from "@tscircuit/copper-pour-solver"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Net } from "../Net"
import type { PcbCopperPour, SourceNet } from "circuit-json"

export { type CopperPourProps }

export class CopperPour extends PrimitiveComponent<typeof copperPourProps> {
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CopperPour",
      zodProps: copperPourProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    return { width: 0, height: 0 }
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
      const sourceNet: SourceNet =
        (db
          .toArray()
          .filter(
            (elm) => elm.type === "source_net" && elm.name === net.name,
          )[0] as SourceNet) || ""
      const inputProblem = convertCircuitJsonToInputProblem(db.toArray(), {
        layer: props.layer,
        pour_connectivity_key: sourceNet.subcircuit_connectivity_map_key || "",
        pad_margin: props.padMargin ?? 0.2,
        trace_margin: props.traceMargin ?? 0.2,
      })

      const solver = new CopperPourPipelineSolver(inputProblem)

      const { brep_shapes } = solver.getOutput()

      for (const brep_shape of brep_shapes) {
        db.pcb_copper_pour.insert({
          shape: "brep",
          layer: props.layer,
          brep_shape,
          source_net_id: net.source_net_id,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        } as PcbCopperPour)
      }
    })
  }
}
