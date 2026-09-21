import { assemblySubassemblyProps } from "@tscircuit/props"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { isValidElement } from "react"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"
import { resolveAssemblyPlacement } from "./resolve-assembly-placement"

export class AssemblySubassembly
  extends PrimitiveComponent<typeof assemblySubassemblyProps>
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
    const sourceComponent = this.root!.db.source_component.insert({
      ftype: "simple_chip",
      name: this.name,
    })
    this.source_component_id = sourceComponent.source_component_id
  }

  doInitialCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.source_component_id) return
    const placement = resolveAssemblyPlacement(this)
    const model = this._parsedProps.cadModel
    if (model && !(typeof model === "object" && "type" in model)) {
      this.cad_component_id = renderAssemblyCadModel(this, model, placement)
    }
  }
}
