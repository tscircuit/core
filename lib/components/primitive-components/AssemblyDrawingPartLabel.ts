import { assemblyDrawingPartLabelProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Drawing authoring metadata; never changes assembled geometry. */
export class AssemblyDrawingPartLabel extends PrimitiveComponent<
  typeof assemblyDrawingPartLabelProps
> {
  get config() {
    return {
      componentName: "AssemblyDrawingPartLabel",
      zodProps: assemblyDrawingPartLabelProps,
    }
  }
  override doInitialAssignNameToUnnamedComponents(): void {}
  doInitialSourceRender(): void {
    if (
      !["AssemblyDrawingPartView", "AssemblyDrawingExplosionView"].includes(
        this.parent?.componentName ?? "",
      )
    )
      throw new Error(
        "assembly.drawing.partlabel must belong to a drawing view",
      )
    if (this.children.length)
      throw new Error("assembly.drawing.partlabel cannot contain children")
  }
}
