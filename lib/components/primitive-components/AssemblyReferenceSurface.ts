import { assemblyReferenceSurfaceProps } from "@tscircuit/props"
import type { NamedReferencePlane, Vector3D } from "jscad-planner"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class AssemblyReferenceSurface extends PrimitiveComponent<
  typeof assemblyReferenceSurfaceProps
> {
  get config() {
    return {
      componentName: "AssemblyReferenceSurface",
      zodProps: assemblyReferenceSurfaceProps,
    }
  }

  doInitialSourceRender(): void {
    if (
      this.parent?.componentName !== "AssemblyPart" &&
      this.parent?.componentName !== "AssemblyPrintedPart"
    )
      throw new Error(
        `Reference surface "${this.name}" must be a child of assembly.part or assembly.printedpart`,
      )
  }

  /** Part-local frame, right-handed XYZ in mm: origin is a point, normal and
   * xAxis are unit directions. XY faces +Z, XZ faces +Y, YZ faces +X.
   * XZ's second tangent is -Z so its tangent basis remains right-handed.
   */
  get referenceFrame(): NamedReferencePlane {
    const { name, plane, normalDirection, xOffset, yOffset, zOffset } =
      this._parsedProps
    const sign = normalDirection === "negative" ? -1 : 1
    const normal: Vector3D =
      plane === "xy"
        ? [0, 0, sign]
        : plane === "xz"
          ? [0, sign, 0]
          : [sign, 0, 0]
    const xAxis: Vector3D = plane === "yz" ? [0, 1, 0] : [1, 0, 0]
    return { name, origin: [xOffset, yOffset, zOffset], normal, xAxis }
  }
}
