import { assemblyDrawingTitleBlockProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class AssemblyDrawingTitleBlock extends PrimitiveComponent<
  typeof assemblyDrawingTitleBlockProps
> {
  get config() {
    return {
      componentName: "AssemblyDrawingTitleBlock",
      zodProps: assemblyDrawingTitleBlockProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (this.parent?.componentName !== "AssemblyDrawingPage")
      throw new Error(
        "assembly.drawing.titleblock must belong to a drawing page",
      )
    if (this.children.length)
      throw new Error("assembly.drawing.titleblock cannot contain children")
  }
}
