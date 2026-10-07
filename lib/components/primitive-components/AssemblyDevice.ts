import { assemblyDeviceProps } from "@tscircuit/props"
import { type Matrix, identity } from "transformation-matrix"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { resolveAssemblyModel } from "./resolve-assembly-model"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"
import {
  applyAssemblyExplodedView,
  type CadComponentId,
} from "./apply-assembly-exploded-view"

export class AssemblyDevice
  extends PrimitiveComponent<typeof assemblyDeviceProps>
  implements AssemblyDeviceContainer
{
  isAssemblyDeviceContainer = true as const
  private explodedViewCadComponentIds = new Set<CadComponentId>()

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
    if (!this.root || this.root.pcbDisabled) return
    if (this.source_component_id && model) {
      // Devices retain their world frame: right-handed, +X right, +Y top,
      // +Z above; the origin is a point in millimetres, independent of children.
      this.cad_component_id = renderAssemblyCadModel(this, model, {
        position: { x: 0, y: 0, z: 0 },
        pcbRotation: 0,
        layer: "top",
      })
    }
    this.explodedViewCadComponentIds = applyAssemblyExplodedView({
      assemblyDevice: this,
      previousCadComponentIds: this.explodedViewCadComponentIds,
    })
  }

  updateCadModelRender(): void {
    this.explodedViewCadComponentIds = applyAssemblyExplodedView({
      assemblyDevice: this,
      previousCadComponentIds: this.explodedViewCadComponentIds,
    })
  }
}
