import { cadmodelProps, point3 } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { CadModelProps } from "@tscircuit/props"
import { z } from "zod"
import type { CadComponent } from "circuit-json"
import { distance } from "circuit-json"
import { decomposeTSR } from "transformation-matrix"
import { getFileExtension } from "../base-components/NormalComponent/utils/getFileExtension"
import { constructAssetUrl } from "lib/utils/constructAssetUrl"

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
    if (!props) return

    const propsRecord = props as unknown as Record<string, unknown>
    const modelUrl =
      typeof propsRecord.modelUrl === "string"
        ? (propsRecord.modelUrl as string)
        : undefined

    const hasCadUrl =
      typeof modelUrl === "string" ||
      typeof propsRecord.stepUrl === "string" ||
      typeof propsRecord.stlUrl === "string" ||
      typeof propsRecord.objUrl === "string" ||
      typeof propsRecord.gltfUrl === "string" ||
      typeof propsRecord.glbUrl === "string" ||
      typeof propsRecord.wrlUrl === "string"

    if (!hasCadUrl) return

    // Get the accumulated rotation from the parent's global transform
    const parentTransform = parent._computePcbGlobalTransformBeforeLayout()
    const decomposedTransform = decomposeTSR(parentTransform)
    const accumulatedRotation =
      (decomposedTransform.rotation.angle * 180) / Math.PI

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

    const zOffsetFromSurface =
      props.zOffsetFromSurface !== undefined
        ? distance.parse(props.zOffsetFromSurface)
        : 0

    const layer = parent.props.layer === "bottom" ? "bottom" : "top"

    const urlProps: Partial<CadComponent> = {}
    const addUrlProp = (value: unknown, field: keyof CadComponent) => {
      if (typeof value !== "string" || value.length === 0) return
      const transformed = this._addCachebustToModelUrl(value)
      if (transformed) urlProps[field] = transformed
    }

    if (modelUrl) {
      const transformedModelUrl = this._addCachebustToModelUrl(modelUrl)
      if (transformedModelUrl) {
        const ext = getFileExtension(modelUrl)
        if (ext === "stl") urlProps.model_stl_url = transformedModelUrl
        else if (ext === "obj") urlProps.model_obj_url = transformedModelUrl
        else if (ext === "gltf") urlProps.model_gltf_url = transformedModelUrl
        else if (ext === "glb") urlProps.model_glb_url = transformedModelUrl
        else if (ext === "step" || ext === "stp")
          urlProps.model_step_url = transformedModelUrl
        else if (ext === "wrl" || ext === "vrml")
          urlProps.model_wrl_url = transformedModelUrl
        else urlProps.model_stl_url = transformedModelUrl
      }
    }

    addUrlProp(propsRecord.stepUrl, "model_step_url")
    addUrlProp(propsRecord.stlUrl, "model_stl_url")
    addUrlProp(propsRecord.objUrl, "model_obj_url")
    addUrlProp(propsRecord.mtlUrl, "model_mtl_url")
    addUrlProp(propsRecord.gltfUrl, "model_gltf_url")
    addUrlProp(propsRecord.glbUrl, "model_glb_url")
    addUrlProp(propsRecord.wrlUrl, "model_wrl_url")

    const cad = db.cad_component.insert({
      position: {
        x: bounds.center.x + Number(positionOffset.x),
        y: bounds.center.y + Number(positionOffset.y),
        z:
          (layer === "bottom" ? -boardThickness / 2 : boardThickness / 2) +
          (layer === "bottom" ? -zOffsetFromSurface : zOffsetFromSurface) +
          Number(positionOffset.z),
      },
      rotation: {
        x: Number(rotationOffset.x),
        y: (layer === "top" ? 0 : 180) + Number(rotationOffset.y),
        z:
          layer === "bottom"
            ? -(accumulatedRotation + Number(rotationOffset.z)) + 180
            : accumulatedRotation + Number(rotationOffset.z),
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
    if (!url) return url
    const baseUrl = this.root?.platform?.projectBaseUrl
    const transformedUrl = constructAssetUrl(url, baseUrl)
    if (!transformedUrl.includes("modelcdn.tscircuit.com"))
      return transformedUrl
    const origin = this.root?.getClientOrigin() ?? ""
    return `${transformedUrl}${transformedUrl.includes("?") ? "&" : "?"}cachebust_origin=${encodeURIComponent(origin)}`
  }
}
