import { assemblyDrawingNoteProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Drawing authoring metadata; never changes assembled geometry. */
export class AssemblyDrawingNote extends PrimitiveComponent<
  typeof assemblyDrawingNoteProps
> {
  get config() {
    return {
      componentName: "AssemblyDrawingNote",
      zodProps: assemblyDrawingNoteProps,
    }
  }
  override doInitialAssignNameToUnnamedComponents(): void {}
  doInitialSourceRender(): void {
    if (
      ![
        "AssemblyDrawingPage",
        "AssemblyDrawingPartView",
        "AssemblyDrawingExplosionView",
      ].includes(this.parent?.componentName ?? "")
    )
      throw new Error(
        "assembly.drawing.note must belong to a drawing page or view",
      )
    if (this.children.length)
      throw new Error("assembly.drawing.note cannot contain children")
  }
}
