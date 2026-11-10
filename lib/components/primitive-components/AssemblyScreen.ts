import { assemblyScreenProps } from "@tscircuit/props"
import { AssemblyComponent } from "../base-components/AssemblyComponent"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { AssemblyScreen_doInitialCadModelRender } from "./AssemblyScreen_doInitialCadModelRender"

export class AssemblyScreen
  extends AssemblyComponent<typeof assemblyScreenProps>
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
      ftype: "subassembly",
      name: this.name,
    })
    this.source_component_id = sourceComponent.source_component_id
  }

  doInitialCadModelRender(): void {
    AssemblyScreen_doInitialCadModelRender(this)
  }
}
