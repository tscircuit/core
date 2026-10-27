import { assemblyDrawingDimensionProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Authoring intent only. The page resolves dimensions after CAD rendering. */
export class AssemblyDrawingDimension extends PrimitiveComponent<
  typeof assemblyDrawingDimensionProps
> {
  get config() {
    return {
      componentName: "AssemblyDrawingDimension",
      zodProps: assemblyDrawingDimensionProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (this.parent?.componentName !== "AssemblyDrawingPartView")
      throw new Error(
        "assembly.drawing.dimension must belong to a drawing part view",
      )
    if (this.children.length)
      throw new Error("assembly.drawing.dimension cannot contain children")
  }
}
