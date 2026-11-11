import { assemblyBoltProps } from "@tscircuit/props"
import { isValidElement } from "react"
import { AssemblyComponent } from "../base-components/AssemblyComponent"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { getPartReferenceSurfaces } from "./get-part-reference-surfaces"
import { renderPartReferenceSurfaces } from "./render-part-reference-surfaces"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"
import { resolveAssemblyPlacement } from "./resolve-assembly-placement"
import { resolveAssemblyBoltModel } from "./resolve-assembly-bolt-model"

export class AssemblyBolt
  extends AssemblyComponent<typeof assemblyBoltProps>
  implements AssemblyDeviceContainer
{
  isAssemblyDeviceContainer = true as const

  get config() {
    return { componentName: "AssemblyBolt", zodProps: assemblyBoltProps }
  }

  doInitialReactSubtreesRender(): void {
    if (isValidElement(this.props.cadModel))
      this.add(createInstanceFromReactElement(this.props.cadModel))
  }

  doInitialSourceRender(): void {
    getPartReferenceSurfaces(this)
    this.source_component_id = this.root!.db.source_component.insert({
      ftype: "subassembly",
      name: this.name,
      display_name: this._parsedProps.displayName,
    }).source_component_id
  }

  doInitialCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.source_component_id) return
    renderPartReferenceSurfaces(this)
    const model = resolveAssemblyBoltModel(this) ?? this._parsedProps.cadModel
    if (model && !(typeof model === "object" && "type" in model))
      this.cad_component_id = renderAssemblyCadModel(
        this,
        model,
        resolveAssemblyPlacement(this),
      )
  }
}
