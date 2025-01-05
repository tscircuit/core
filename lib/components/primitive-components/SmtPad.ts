import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { smtPadProps } from "@tscircuit/props"
import type { Port } from "./Port"
import type { RenderPhaseFn } from "../base-components/Renderable"
import type { LayerRef, PcbSmtPad } from "circuit-json"
import {
  applyToPoint,
  compose,
  decomposeTSR,
  flipX,
  flipY,
  translate,
} from "transformation-matrix"

export class SmtPad extends PrimitiveComponent<typeof smtPadProps> {
  pcb_smtpad_id: string | null = null

  matchedPort: Port | null = null

  isPcbPrimitive = true

  get config() {
    return {
      componentName: "SmtPad",
      zodProps: smtPadProps,
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

  doInitialPortMatching(): void {
    const parentPorts = this.getPrimitiveContainer()?.selectAll(
      "port",
    ) as Port[]

    if (!this.props.portHints) {
      return
    }

    for (const port of parentPorts) {
      if (port.isMatchingAnyOf(this.props.portHints)) {
        this.matchedPort = port
        port.registerMatch(this)
        return
      }
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    if (!props.portHints) return
    const container = this.getPrimitiveContainer()
    const position = this._getGlobalPcbPositionBeforeLayout()
    const containerCenter = container?._getGlobalPcbPositionBeforeLayout()
    const decomposedMat = decomposeTSR(
      this._computePcbGlobalTransformBeforeLayout(),
    )
    const isRotated90 =
      Math.abs(decomposedMat.rotation.angle * (180 / Math.PI) - 90) % 180 < 0.01

    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()

    const parentRotation = container?._parsedProps.pcbRotation ?? 0

    let pcb_smtpad: PcbSmtPad | null = null
    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    if (props.shape === "circle") {
      pcb_smtpad = db.pcb_smtpad.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!, // port likely isn't matched
        layer: maybeFlipLayer(props.layer ?? "top"),
        shape: "circle",

        // @ts-ignore: no idea why this is triggering
        radius: props.radius!,

        port_hints: props.portHints.map((ph) => ph.toString()),

        x: position.x,
        y: position.y,
      })
      db.pcb_solder_paste.insert({
        layer: pcb_smtpad.layer,
        shape: "circle",
        // @ts-ignore: no idea why this is triggering
        radius: pcb_smtpad.radius * 0.7,
        x: pcb_smtpad.x,
        y: pcb_smtpad.y,
        pcb_component_id: pcb_smtpad.pcb_component_id,
        pcb_smtpad_id: pcb_smtpad.pcb_smtpad_id,
      })
    } else if (props.shape === "rect") {
      pcb_smtpad =
        parentRotation === 0 || isRotated90
          ? db.pcb_smtpad.insert({
              pcb_component_id,
              pcb_port_id: this.matchedPort?.pcb_port_id!, // port likely isn't matched
              layer: maybeFlipLayer(props.layer ?? "top"),
              shape: "rect",

              ...{
                width: isRotated90 ? props.height : props.width,
                height: isRotated90 ? props.width : props.height,
              },

              port_hints: props.portHints.map((ph) => ph.toString()),

              x: position.x,
              y: position.y,
            })
          : db.pcb_smtpad.insert({
              pcb_component_id,
              layer: props.layer ?? "top",
              shape: "rotated_rect",
              ...{ width: props.width, height: props.height },
              x: position.x,
              y: position.y,
              ccw_rotation: parentRotation,
              port_hints: props.portHints.map((ph) => ph.toString()),
            } as PcbSmtPad)
      if (pcb_smtpad.shape === "rect")
        db.pcb_solder_paste.insert({
          layer: pcb_smtpad.layer,
          shape: "rect",
          // @ts-ignore: no idea why this is triggering
          width: pcb_smtpad.width * 0.7,
          height: pcb_smtpad.height * 0.7,
          x: pcb_smtpad.x,
          y: pcb_smtpad.y,
          pcb_component_id: pcb_smtpad.pcb_component_id,
          pcb_smtpad_id: pcb_smtpad.pcb_smtpad_id,
        })
    }
    if (pcb_smtpad) {
      this.pcb_smtpad_id = pcb_smtpad.pcb_smtpad_id
    }
  }

  doInitialPcbPortAttachment(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    db.pcb_smtpad.update(this.pcb_smtpad_id!, {
      pcb_port_id: this.matchedPort?.pcb_port_id!,
    })
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    const smtpad = db.pcb_smtpad.get(this.pcb_smtpad_id!)!

    if (smtpad.shape === "rect") {
      return {
        center: { x: smtpad.x, y: smtpad.y },
        bounds: {
          left: smtpad.x - smtpad.width / 2,
          top: smtpad.y + smtpad.height / 2,
          right: smtpad.x + smtpad.width / 2,
          bottom: smtpad.y - smtpad.height / 2,
        },
        width: smtpad.width,
        height: smtpad.height,
      }
    }
    if (smtpad.shape === "rotated_rect") {
      const angleRad = (smtpad.ccw_rotation * Math.PI) / 180
      const cosAngle = Math.cos(angleRad)
      const sinAngle = Math.sin(angleRad)

      const w2 = smtpad.width / 2
      const h2 = smtpad.height / 2

      const xExtent = Math.abs(w2 * cosAngle) + Math.abs(h2 * sinAngle)
      const yExtent = Math.abs(w2 * sinAngle) + Math.abs(h2 * cosAngle)

      return {
        center: { x: smtpad.x, y: smtpad.y },
        bounds: {
          left: smtpad.x - xExtent,
          right: smtpad.x + xExtent,
          top: smtpad.y - yExtent,
          bottom: smtpad.y + yExtent,
        },
        width: xExtent * 2,
        height: yExtent * 2,
      }
    }
    if (smtpad.shape === "circle") {
      return {
        center: { x: smtpad.x, y: smtpad.y },
        bounds: {
          left: smtpad.x - smtpad.radius,
          top: smtpad.y - smtpad.radius,
          right: smtpad.x + smtpad.radius,
          bottom: smtpad.y + smtpad.radius,
        },
        width: smtpad.radius * 2,
        height: smtpad.radius * 2,
      }
    }
    throw new Error(
      `circuitJson bounds calculation not implemented for shape "${(smtpad as any).shape}"`,
    )
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    db.pcb_smtpad.update(this.pcb_smtpad_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })

    const solderPaste = db.pcb_solder_paste
      .list()
      .find((elm) => elm.pcb_smtpad_id === this.pcb_smtpad_id)
    db.pcb_solder_paste.update(solderPaste?.pcb_solder_paste_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })

    this.matchedPort?._setPositionFromLayout(newCenter)
  }
}
