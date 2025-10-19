import { panelProps } from "@tscircuit/props"
import type { LayerRef } from "circuit-json"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Group } from "../primitive-components/Group/Group"

export class Panel extends Group<typeof panelProps> {
  get config() {
    return {
      componentName: "Panel",
      zodProps: panelProps,
    }
  }

  get isGroup() {
    return true
  }

  add(component: PrimitiveComponent) {
    if (component.lowercaseComponentName !== "board") {
      throw new Error("<panel> can only contain <board> elements")
    }
    super.add(component)
  }

  runRenderCycle() {
    if (!this.children.some((child) => child.componentName === "Board")) {
      throw new Error("<panel> must contain at least one <board>")
    }

    super.runRenderCycle()
  }

  get primaryBoard(): PrimitiveComponent & {
    boardThickness: number
    _connectedSchematicPortPairs: Set<string>
    allLayers: LayerRef[]
  } {
    const boardChild = this.children.find(
      (child) => child.componentName === "Board",
    )

    if (!boardChild) {
      throw new Error("<panel> must contain at least one <board>")
    }

    return boardChild as PrimitiveComponent & {
      boardThickness: number
      _connectedSchematicPortPairs: Set<string>
      allLayers: LayerRef[]
    }
  }
}
