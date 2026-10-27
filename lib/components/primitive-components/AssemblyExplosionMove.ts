import { assemblyExplosionMoveProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Straight translation instruction; displacement is resolved after mounting. */
export class AssemblyExplosionMove extends PrimitiveComponent<
  typeof assemblyExplosionMoveProps
> {
  get config() {
    return {
      componentName: "AssemblyExplosionMove",
      zodProps: assemblyExplosionMoveProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (this.parent?.componentName !== "AssemblyExplosionStage") {
      throw new Error("An explosion move must belong to an explosion stage")
    }
  }
}
