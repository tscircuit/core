import { assemblySubassemblyProps } from "@tscircuit/props"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { isValidElement } from "react"
import { AssemblyComponent } from "../base-components/AssemblyComponent"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"
import { resolveAssemblyPlacement } from "./resolve-assembly-placement"
import { resolveAssemblyModel } from "./resolve-assembly-model"
import { getPartReferenceSurfaces } from "./get-part-reference-surfaces"
import { renderPartReferenceSurfaces } from "./render-part-reference-surfaces"

export class AssemblySubassembly
  extends AssemblyComponent<typeof assemblySubassemblyProps>
  implements AssemblyDeviceContainer
{
  isAssemblyDeviceContainer = true as const

  get config() {
    return {
      componentName: "AssemblySubassembly",
      zodProps: assemblySubassemblyProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {
    if (this._parsedProps.name) return
    throw new Error("assembly.subassembly requires a non-empty name")
  }

  doInitialReactSubtreesRender(): void {
    if (isValidElement(this.props.cadModel))
      this.add(createInstanceFromReactElement(this.props.cadModel))
  }

  doInitialSourceRender(): void {
    getPartReferenceSurfaces(this)
    const sourceComponent = this.root!.db.source_component.insert({
      ftype: "subassembly",
      name: this.name,
    })
    this.source_component_id = sourceComponent.source_component_id
  }

  doInitialCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.source_component_id) return
    renderPartReferenceSurfaces(this)
    const placement = resolveAssemblyPlacement(this)
    const model =
      resolveAssemblyModel(this._parsedProps) ?? this._parsedProps.cadModel
    if (model && !(typeof model === "object" && "type" in model)) {
      this.cad_component_id = renderAssemblyCadModel(this, model, placement)
    }
  }
}
