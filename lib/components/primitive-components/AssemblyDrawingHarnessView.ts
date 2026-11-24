import { assemblyDrawingHarnessViewProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Drawing metadata only; a flattened view of one assembly.cable. */
export class AssemblyDrawingHarnessView extends PrimitiveComponent<
  typeof assemblyDrawingHarnessViewProps
> {
  get config() {
    return {
      componentName: "AssemblyDrawingHarnessView",
      zodProps: assemblyDrawingHarnessViewProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (this.parent?.componentName !== "AssemblyDrawingPage")
      throw new Error(
        "assembly.drawing.harnessview must belong to a drawing page",
      )
    if (
      this.children.some(
        (child) => child.componentName !== "AssemblyDrawingNote",
      )
    )
      throw new Error("assembly.drawing.harnessview can contain only notes")
  }
}
