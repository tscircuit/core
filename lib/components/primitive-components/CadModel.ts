import { cadmodelProps, point3 } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { CadModelProps } from "@tscircuit/props"
import { z } from "zod"
import type { CadComponent } from "circuit-json"

const rotation = z.union([z.number(), z.string()])
const rotation3 = z.object({ x: rotation, y: rotation, z: rotation })

export class CadModel extends PrimitiveComponent<typeof cadmodelProps> {
  get config() {
    return {
      componentName: "CadModel",
      zodProps: cadmodelProps,
    }
  }

  doInitialCadModelRender(): void {
    const parent = this._findParentWithPcbComponent()
    if (!parent) return
    if (!parent.pcb_component_id) return

    const { db } = this.root!
    const { boardThickness = 0 } = this.root?._getBoard() ?? {}

    const bounds = parent._getPcbCircuitJsonBounds()
    const pcb_component = db.pcb_component.get(parent.pcb_component_id)

    const props = this._parsedProps as CadModelProps

    if (!props || typeof props.modelUrl !== "string") return

    const rotationOffset = rotation3.parse({ x: 0, y: 0, z: 0 })
    if (typeof props.rotationOffset === "number") {
      rotationOffset.z = Number(props.rotationOffset)
    } else if (typeof props.rotationOffset === "object") {
      const parsed = rotation3.parse(props.rotationOffset)
      rotationOffset.x = Number(parsed.x)
      rotationOffset.y = Number(parsed.y)
      rotationOffset.z = Number(parsed.z)
    }

    const positionOffset = point3.parse({
      x: props.pcbX ?? 0,
      y: props.pcbY ?? 0,
      z: props.pcbZ ?? 0,
      ...(typeof props.positionOffset === "object" ? props.positionOffset : {}),
    })

    const layer = parent.props.layer === "bottom" ? "bottom" : "top"

    const ext = new URL(props.modelUrl).pathname.split(".").pop()?.toLowerCase()
    const urlProps: Partial<CadComponent> = {}
    if (ext === "stl")
      urlProps.model_stl_url = this._addCachebustToModelUrl(props.modelUrl)
    else if (ext === "obj")
      urlProps.model_obj_url = this._addCachebustToModelUrl(props.modelUrl)
    else if (ext === "gltf")
      urlProps.model_gltf_url = this._addCachebustToModelUrl(props.modelUrl)
    else if (ext === "glb")
      urlProps.model_glb_url = this._addCachebustToModelUrl(props.modelUrl)
    else if (ext === "step" || ext === "stp")
      urlProps.model_step_url = this._addCachebustToModelUrl(props.modelUrl)
    else if (ext === "wrl" || ext === "vrml")
      urlProps.model_wrl_url = this._addCachebustToModelUrl(props.modelUrl)
    else urlProps.model_stl_url = this._addCachebustToModelUrl(props.modelUrl)

    const cad = db.cad_component.insert({
      position: {
        x: bounds.center.x + Number(positionOffset.x),
        y: bounds.center.y + Number(positionOffset.y),
        z:
          (layer === "bottom" ? -boardThickness / 2 : boardThickness / 2) +
          Number(positionOffset.z),
      },
      rotation: {
        x: Number(rotationOffset.x),
        y: (layer === "top" ? 0 : 180) + Number(rotationOffset.y),
        z:
          layer === "bottom"
            ? -((pcb_component?.rotation ?? 0) + Number(rotationOffset.z)) + 180
            : (pcb_component?.rotation ?? 0) + Number(rotationOffset.z),
      },
      pcb_component_id: parent.pcb_component_id,
      source_component_id: parent.source_component_id,
      model_unit_to_mm_scale_factor:
        typeof props.modelUnitToMmScale === "number"
          ? props.modelUnitToMmScale
          : undefined,
      ...urlProps,
    } as any)

    this.cad_component_id = cad.cad_component_id
  }

  private _findParentWithPcbComponent(): any {
    let p: any = this.parent
    while (p && !p.pcb_component_id) p = p.parent
    return p
  }

  private _addCachebustToModelUrl(url: string | undefined): string | undefined {
    if (!url || !url.includes("modelcdn.tscircuit.com")) return url
    const origin = this.root?.getClientOrigin() ?? ""
    return `${url}${url.includes("?") ? "&" : "?"}cachebust_origin=${encodeURIComponent(origin)}`
  }
}
