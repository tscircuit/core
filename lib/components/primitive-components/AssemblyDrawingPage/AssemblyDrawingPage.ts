import { assemblyDrawingPageProps } from "@tscircuit/props"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { AssemblyDrawingPage_doInitialDrawingRender } from "./AssemblyDrawingPage_doInitialDrawingRender"

export class AssemblyDrawingPage extends PrimitiveComponent<
  typeof assemblyDrawingPageProps
> {
  drawingRenderError?: unknown

  get config() {
    return {
      componentName: "AssemblyDrawingPage",
      zodProps: assemblyDrawingPageProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (
      this.children.some(
        (child) =>
          child.componentName !== "AssemblyDrawingPartView" &&
          child.componentName !== "AssemblyDrawingTitleBlock",
      )
    )
      throw new Error(
        "Drawing pages can contain only part views and a title block",
      )
    if (
      this.children.filter(
        (child) => child.componentName === "AssemblyDrawingTitleBlock",
      ).length > 1
    )
      throw new Error("A drawing page can contain at most one title block")
  }

  updateDrawingRender(): void {
    if (this.drawingRenderError) throw this.drawingRenderError
  }

  doInitialDrawingRender(): void {
    AssemblyDrawingPage_doInitialDrawingRender(this)
  }
}
