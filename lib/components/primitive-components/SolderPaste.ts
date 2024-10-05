import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { solderPasteProps } from "@tscircuit/props"
import type { PcbSolderPaste } from "circuit-json"
import { decomposeTSR } from "transformation-matrix"

export class SolderPaste extends PrimitiveComponent<typeof solderPasteProps> {
  pcb_solder_paste_id: string | null = null

  pcb_smtpad_id: string | null = null

  isPcbPrimitive = true

  get config() {
    return {
      componentName: "SolderPaste",
      zodProps: solderPasteProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.shape === "circle") {
      return { width: props.radius! * 2, height: props.radius! * 2 }
    }
    if (props.shape === "rect") {
      return { width: props.width!, height: props.height! }
    }
    throw new Error(
      `getPcbSize for shape "${(props as any).shape}" not implemented for ${this.componentName}`,
    )
  }

  doInitialPcbPrimitiveRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const decomposedMat = decomposeTSR(
      this._computePcbGlobalTransformBeforeLayout(),
    )
    const isRotated90 =
      Math.abs(decomposedMat.rotation.angle * (180 / Math.PI) - 90) < 0.01

    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()

    let pcb_solder_paste: PcbSolderPaste | null = null
    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    if (props.shape === "circle") {
      pcb_solder_paste = db.pcb_solder_paste.insert({
        pcb_component_id,
        pcb_smtpad_id: this.pcb_smtpad_id || "",
        layer: maybeFlipLayer(props.layer ?? "top"),
        shape: "circle",

        // @ts-ignore: no idea why this is triggering
        radius: props.radius!,

        x: position.x,
        y: position.y,
      })
    } else if (props.shape === "rect") {
      pcb_solder_paste = db.pcb_solder_paste.insert({
        pcb_component_id,
        pcb_smtpad_id: this.pcb_smtpad_id || "",
        layer: maybeFlipLayer(props.layer ?? "top"),
        shape: "rect",

        ...(isRotated90
          ? { width: props.height, height: props.width }
          : { width: props.width, height: props.height }),

        x: position.x,
        y: position.y,
      })
    }
    if (pcb_solder_paste) {
      this.pcb_solder_paste_id = pcb_solder_paste.pcb_solder_paste_id!
    }
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    const solderPaste = db.pcb_solder_paste.get(this.pcb_solder_paste_id!)!

    if (solderPaste.shape === "rect") {
      return {
        center: { x: solderPaste.x, y: solderPaste.y },
        bounds: {
          left: solderPaste.x - solderPaste.width / 2,
          top: solderPaste.y - solderPaste.height / 2,
          right: solderPaste.x + solderPaste.width / 2,
          bottom: solderPaste.y + solderPaste.height / 2,
        },
        width: solderPaste.width,
        height: solderPaste.height,
      }
    }
    if (solderPaste.shape === "circle") {
      return {
        center: { x: solderPaste.x, y: solderPaste.y },
        bounds: {
          left: solderPaste.x - solderPaste.radius,
          top: solderPaste.y - solderPaste.radius,
          right: solderPaste.x + solderPaste.radius,
          bottom: solderPaste.y + solderPaste.radius,
        },
        width: solderPaste.radius * 2,
        height: solderPaste.radius * 2,
      }
    }
    throw new Error(
      `circuitJson bounds calculation not implemented for shape "${(solderPaste as any).shape}"`,
    )
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    db.pcb_solder_paste.update(this.pcb_solder_paste_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })
  }
}
