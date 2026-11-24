import { assemblyDrawingBomTableProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Drawing metadata only; a numbered parts list derived from BOM records. */
export class AssemblyDrawingBomTable extends PrimitiveComponent<
  typeof assemblyDrawingBomTableProps
> {
  get config() {
    return {
      componentName: "AssemblyDrawingBomTable",
      zodProps: assemblyDrawingBomTableProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (this.parent?.componentName !== "AssemblyDrawingPage")
      throw new Error("assembly.drawing.bomtable must belong to a drawing page")
    if (this.children.length)
      throw new Error("assembly.drawing.bomtable cannot contain children")
  }
}
