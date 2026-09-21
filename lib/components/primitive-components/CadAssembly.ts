import { cadassemblyProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { findParentAssembly } from "./resolve-assembly-placement"

export class CadAssembly extends PrimitiveComponent<typeof cadassemblyProps> {
  isPrimitiveContainer = true
  override doInitialAssignNameToUnnamedComponents(): void {
    if (findParentAssembly(this)) return
    super.doInitialAssignNameToUnnamedComponents()
  }

  get config() {
    return {
      componentName: "CadAssembly",
      zodProps: cadassemblyProps,
    }
  }
}
