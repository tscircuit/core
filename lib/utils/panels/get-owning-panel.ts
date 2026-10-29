import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Panel } from "lib/components/normal-components/Panel"

/** Returns panel ownership only for copper outside a child board. */
export const getOwningPanel = (
  component: PrimitiveComponent,
): Panel | undefined => {
  let ancestor: PrimitiveComponent | null = component
  while (ancestor) {
    if (
      ancestor.componentName === "Board" ||
      ancestor.componentName === "MountedBoard"
    )
      return
    if (ancestor.componentName === "Panel") return ancestor as Panel
    ancestor = ancestor.parent
  }
}
