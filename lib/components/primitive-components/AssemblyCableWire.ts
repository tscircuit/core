import { assemblyCableWireProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** One conductor of its parent assembly.cable. The cable emits the record. */
export class AssemblyCableWire extends PrimitiveComponent<
  typeof assemblyCableWireProps
> {
  get config() {
    return {
      componentName: "AssemblyCableWire",
      zodProps: assemblyCableWireProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (this.parent?.componentName !== "AssemblyCable")
      throw new Error("assembly.cablewire must belong to an assembly.cable")
    if (this.children.length)
      throw new Error("assembly.cablewire cannot contain children")
  }

  onPropsChange(): void {
    this.parent?._markDirty("CadModelRender")
    this.parent?._markDirty("CadAssemblyBomRender")
  }
}
