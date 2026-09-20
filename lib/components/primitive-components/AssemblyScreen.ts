import { assemblyScreenProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { AssemblyScreen_doInitialCadModelRender } from "./AssemblyScreen_doInitialCadModelRender"

export class AssemblyScreen
  extends PrimitiveComponent<typeof assemblyScreenProps>
  implements AssemblyDeviceContainer
{
  isAssemblyDeviceContainer = true as const

  get config() {
    return {
      componentName: "AssemblyScreen",
      zodProps: assemblyScreenProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {
    if (this._parsedProps.name) return
    throw new Error("assembly.screen requires a non-empty name")
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
    // layer, and rotation are synchronized to connectsTo during CadModelRender,
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
    AssemblyScreen_doInitialCadModelRender(this)
  }
}
