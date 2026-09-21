import { assemblySubassemblyProps } from "@tscircuit/props"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { isValidElement } from "react"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"
import {
  resolveAssemblyPlacement,
  updateAssemblyPcbPlacement,
} from "./resolve-assembly-placement"

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

  doInitialPcbComponentRender(): void {
    const root = this.root
    if (!root || root.pcbDisabled || !this.source_component_id) return

    // Compatibility owner for the existing Circuit JSON schema. Final position,
    // layer, and rotation inherit the container during CadModelRender,
    // after component packing and cable-insertion inference have completed.
    const pcbComponent = root.db.pcb_component.insert({
      center: { x: 0, y: 0 },
      width: 0,
      height: 0,
      layer: "top",
      rotation: 0,
      source_component_id: this.source_component_id,
      obstructs_within_bounds: false,
      do_not_place: true,
      is_allowed_to_be_off_board: true,
    })
    this.pcb_component_id = pcbComponent.pcb_component_id
  }

  doInitialCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.pcb_component_id) return
    const placement = resolveAssemblyPlacement(this)
    updateAssemblyPcbPlacement(this, placement)
    const model = this._parsedProps.cadModel
    if (model && !(typeof model === "object" && "type" in model)) {
      this.cad_component_id = renderAssemblyCadModel(this, model, placement)
    }
  }
}
