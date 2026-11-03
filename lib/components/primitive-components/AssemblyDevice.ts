import { assemblyDeviceProps } from "@tscircuit/props"
import { type Matrix, identity } from "transformation-matrix"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { AssemblyComponent } from "../base-components/AssemblyComponent"
import { resolveAssemblyModel } from "./resolve-assembly-model"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"

export class AssemblyDevice
  extends AssemblyComponent<typeof assemblyDeviceProps>
  implements AssemblyDeviceContainer
{
  isAssemblyDeviceContainer = true as const

  get config() {
    return {
      componentName: "AssemblyDevice",
      zodProps: assemblyDeviceProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  override computeSchematicGlobalTransform(): Matrix {
    return identity()
  }

  override _computePcbGlobalTransformBeforeLayout(): Matrix {
    return identity()
  }

  protected get shouldRenderAssemblyBom() {
    const props = this._parsedProps
    return (
      props.model !== undefined ||
      props.modelUrl !== undefined ||
      props.bomQuantity !== undefined ||
      props.purchaseUrls !== undefined ||
      props.supplierPartNumbers !== undefined
    )
  }

  doInitialSourceRender(): void {
    // Model-less devices remain transparent containers with no source record.
    if (
      (this._parsedProps.modelUrl === undefined &&
        this._parsedProps.model === undefined) ||
      !this.root
    )
      return
    this.source_component_id = this.root.db.source_component.insert({
      ftype: "subassembly",
      name: this.name,
    }).source_component_id
  }

  doInitialCadModelRender(): void {
    const model = resolveAssemblyModel(this._parsedProps)
    if (
      !this.root ||
      this.root.pcbDisabled ||
      !this.source_component_id ||
      !model
    )
      return
    // Devices retain their world frame: right-handed, +X right, +Y top,
    // +Z above; the origin is a point in millimetres, independent of children.
    this.cad_component_id = renderAssemblyCadModel(this, model, {
      position: { x: 0, y: 0, z: 0 },
      pcbRotation: 0,
      layer: "top",
    })
  }
}
