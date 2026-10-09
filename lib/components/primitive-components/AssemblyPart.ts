import { assemblyPartProps } from "@tscircuit/props"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { isValidElement } from "react"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"
import { resolveAssemblyModel } from "./resolve-assembly-model"
import { resolveAssemblyPlacement } from "./resolve-assembly-placement"
import { getPartReferenceSurfaces } from "./get-part-reference-surfaces"
import { renderPartReferenceSurfaces } from "./render-part-reference-surfaces"

export class AssemblyPart
  extends PrimitiveComponent<typeof assemblyPartProps>
  implements AssemblyDeviceContainer
{
  isAssemblyDeviceContainer = true as const

  get config() {
    return {
      componentName: "AssemblyPart",
      zodProps: assemblyPartProps,
    }
  }

  doInitialReactSubtreesRender(): void {
    if (isValidElement(this.props.cadModel))
      this.add(createInstanceFromReactElement(this.props.cadModel))
  }

  doInitialSourceRender(): void {
    getPartReferenceSurfaces(this)
    this.source_component_id = this.root!.db.source_component.insert({
      // Circuit JSON currently represents generic assembly geometry as subassembly.
      ftype: "subassembly",
      name: this.name,
      display_name: this._parsedProps.displayName,
    }).source_component_id
  }

  doInitialCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.source_component_id) return
    renderPartReferenceSurfaces(this)
    const model =
      resolveAssemblyModel(this._parsedProps) ?? this._parsedProps.cadModel
    if (model && !(typeof model === "object" && "type" in model)) {
      this.cad_component_id = renderAssemblyCadModel(
        this,
        model,
        resolveAssemblyPlacement(this),
      )
    }
  }
}
