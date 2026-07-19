import { internalCircuitProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { RenderPhase } from "../base-components/Renderable"
import { Chip } from "../normal-components/Chip"

export class InternalCircuit extends PrimitiveComponent<
  typeof internalCircuitProps
> {
  isPrimitiveContainer = true

  get config() {
    return {
      componentName: "InternalCircuit",
      zodProps: internalCircuitProps,
    }
  }

  override onAddToParent(parent: PrimitiveComponent): void {
    if (!(parent instanceof Chip)) {
      throw new Error(
        "<internalcircuit> must be provided through a <chip internalCircuit={...}> prop",
      )
    }
    super.onAddToParent(parent)
  }

  override runRenderPhaseForChildren(phase: RenderPhase): void {
    if (phase.startsWith("Pcb")) {
      return
    }
    for (const child of this.children) {
      child.runRenderPhaseForChildren(phase)
      child.runRenderPhase(phase)
    }
  }
}
