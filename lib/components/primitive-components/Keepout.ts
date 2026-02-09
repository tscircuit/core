import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { pcbKeepoutProps } from "@tscircuit/props"
import type { RenderPhaseFn } from "../base-components/Renderable"
import type { PCBKeepout } from "circuit-json"
import { decomposeTSR } from "transformation-matrix"

export class Keepout extends PrimitiveComponent<typeof pcbKeepoutProps> {
  pcb_keepout_id: string | null = null

  isPcbPrimitive = true

  get config() {
    return {
      componentName: "Keepout",
      zodProps: pcbKeepoutProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const subcircuit = this.getSubcircuit()
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const decomposedMat = decomposeTSR(
      this._computePcbGlobalTransformBeforeLayout(),
    )
    const isRotated90 =
      Math.abs(decomposedMat.rotation.angle * (180 / Math.PI) - 90) % 180 < 0.01

    let pcb_keepout: PCBKeepout | null = null
    if (props.shape === "circle") {
      pcb_keepout = db.pcb_keepout.insert({
        layers: ["top"],
        shape: "circle",
        // @ts-ignore: no idea why this is triggering
        radius: props.radius,
        center: {
          x: position.x,
          y: position.y,
        },
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      })
    } else if (props.shape === "rect") {
      pcb_keepout = db.pcb_keepout.insert({
        layers: ["top"],
        shape: "rect",
        ...(isRotated90
          ? { width: props.height, height: props.width }
          : { width: props.width, height: props.height }),
        // @ts-ignore: no idea why this is triggering
        center: {
          x: position.x,
          y: position.y,
        },
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      })
    }
    if (pcb_keepout) {
      this.pcb_keepout_id = pcb_keepout.pcb_keepout_id
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.shape === "circle") {
      return { width: props.radius * 2, height: props.radius * 2 }
    }
    if (props.shape === "rect") {
      return { width: props.width, height: props.height }
    }
    return { width: 0, height: 0 }
  }
}
