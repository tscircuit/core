import type { DrawingAssemblyStage } from "circuit-json"
import { assemblyDrawingStageProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Drawing authoring metadata; never changes assembled geometry. */
export class AssemblyDrawingStage extends PrimitiveComponent<
  typeof assemblyDrawingStageProps
> {
  drawing_assembly_stage_id?: DrawingAssemblyStage["drawing_assembly_stage_id"]
  get config() {
    return {
      componentName: "AssemblyDrawingStage",
      zodProps: assemblyDrawingStageProps,
    }
  }
  override doInitialAssignNameToUnnamedComponents(): void {}
  doInitialSourceRender(): void {
    if (
      !["AssemblyDevice", "AssemblySubassembly"].includes(
        this.parent?.componentName ?? "",
      )
    )
      throw new Error(
        "assembly.drawing.stage must belong to an assembly device or subassembly",
      )
    if (this.children.length)
      throw new Error("assembly.drawing.stage cannot contain children")
  }
}
