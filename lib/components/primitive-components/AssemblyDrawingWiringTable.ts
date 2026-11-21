import { assemblyDrawingWiringTableProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Drawing metadata only; a wiring list derived from one assembly.cable. */
export class AssemblyDrawingWiringTable extends PrimitiveComponent<
  typeof assemblyDrawingWiringTableProps
> {
  get config() {
    return {
      componentName: "AssemblyDrawingWiringTable",
      zodProps: assemblyDrawingWiringTableProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (this.parent?.componentName !== "AssemblyDrawingPage")
      throw new Error(
        "assembly.drawing.wiringtable must belong to a drawing page",
      )
    if (this.children.length)
      throw new Error("assembly.drawing.wiringtable cannot contain children")
  }
}
