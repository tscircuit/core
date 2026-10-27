import { assemblyExplosionStageProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Instruction metadata; adds no electrical or CAD geometry. */
export class AssemblyExplosionStage extends PrimitiveComponent<
  typeof assemblyExplosionStageProps
> {
  get config() {
    return {
      componentName: "AssemblyExplosionStage",
      zodProps: assemblyExplosionStageProps,
    }
  }

  doInitialSourceRender(): void {
    if (
      this.parent?.componentName !== "AssemblyDevice" &&
      this.parent?.componentName !== "AssemblySubassembly"
    ) {
      throw new Error(
        `Explosion stage "${this.name}" must belong to an assembly device or subassembly`,
      )
    }
    if (
      this.children.some(
        (child) => child.componentName !== "AssemblyExplosionMove",
      )
    ) {
      throw new Error(
        `Explosion stage "${this.name}" can contain only explosion moves`,
      )
    }
  }
}
