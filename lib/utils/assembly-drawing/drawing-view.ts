import { AssemblyDrawingPartView } from "lib/components/primitive-components/AssemblyDrawingPartView"
import { AssemblyDrawingExplosionView } from "lib/components/primitive-components/AssemblyDrawingExplosionView"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
export type AssemblyDrawingView =
  | AssemblyDrawingPartView
  | AssemblyDrawingExplosionView
export const isAssemblyDrawingView = (
  part: PrimitiveComponent,
): part is AssemblyDrawingView =>
  part instanceof AssemblyDrawingPartView ||
  part instanceof AssemblyDrawingExplosionView

export const usesResolvedDrawingScene = (view: AssemblyDrawingView) =>
  Boolean(
    view._parsedProps.stageRef ||
      view.children.some(
        (child) => child.componentName === "AssemblyDrawingPartLabel",
      ),
  )
