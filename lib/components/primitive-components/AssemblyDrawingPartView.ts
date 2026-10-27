import { assemblyDrawingPartViewProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Drawing metadata only; viewport coordinates do not move assembly geometry. */
export class AssemblyDrawingPartView extends PrimitiveComponent<
  typeof assemblyDrawingPartViewProps
> {
  get config() {
    return {
      componentName: "AssemblyDrawingPartView",
      zodProps: assemblyDrawingPartViewProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (this.parent?.componentName !== "AssemblyDrawingPage")
      throw new Error("assembly.drawing.partview must belong to a drawing page")
    if (
      this.children.some(
        (child) => child.componentName !== "AssemblyDrawingDimension",
      )
    )
      throw new Error("assembly.drawing.partview can contain only dimensions")
  }
}
