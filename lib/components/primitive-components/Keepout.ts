import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { pcbKeepoutProps } from "@tscircuit/props"
import type { RenderPhaseFn } from "../base-components/Renderable"
import type { PCBKeepout } from "circuit-json"
import { decomposeTSR } from "transformation-matrix"

export class Keepout extends PrimitiveComponent<typeof pcbKeepoutProps> {
  pcb_keepout_id: string | null = null

  isPcbPrimitive = true
  componentName = "Keepout"

  get config() {
    return {
      zodProps: pcbKeepoutProps,
    }
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
      })
    }
    if (pcb_keepout) {
      this.pcb_keepout_id = pcb_keepout.pcb_keepout_id
    }
  }
}
