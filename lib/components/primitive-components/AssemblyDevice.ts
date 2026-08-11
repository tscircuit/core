import { assemblyDeviceProps } from "@tscircuit/props"
import { type Matrix, identity } from "transformation-matrix"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class AssemblyDevice
  extends PrimitiveComponent<typeof assemblyDeviceProps>
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

  // Compatibility stage: this is a transparent product-level container and emits no
  // Circuit JSON. The later schema migration adds source_assembly_device without
  // changing the authoring element or its assembly-container semantics.
}
