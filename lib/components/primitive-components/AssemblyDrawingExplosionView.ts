import { assemblyDrawingExplosionViewProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Drawing authoring metadata; never changes assembled geometry. */
export class AssemblyDrawingExplosionView extends PrimitiveComponent<
  typeof assemblyDrawingExplosionViewProps
> {
  get config() {
    return {
      componentName: "AssemblyDrawingExplosionView",
      zodProps: assemblyDrawingExplosionViewProps,
    }
  }
  override doInitialAssignNameToUnnamedComponents(): void {}
  doInitialSourceRender(): void {
    if (!["AssemblyDrawingPage"].includes(this.parent?.componentName ?? ""))
      throw new Error(
        "assembly.drawing.explosionview must belong to a drawing page",
      )
    if (
      this.children.some(
        (child) =>
          ![
            "AssemblyDrawingDimension",
            "AssemblyDrawingPartLabel",
            "AssemblyDrawingNote",
          ].includes(child.componentName),
      )
    )
      throw new Error(
        "assembly.drawing.explosionview can contain only dimensions, labels and notes",
      )
  }
}
