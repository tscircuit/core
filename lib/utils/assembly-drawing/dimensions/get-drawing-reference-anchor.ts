import type { AssemblyDrawingDimensionAnchor } from "@tscircuit/props"
import { mat4, vec3 } from "gl-matrix"
import type { createOutlineSection } from "poppygl"

/** Project glTF world points (right-handed +Y up, mm) into orthographic view
 * coordinates (+X right, +Y up, mm). Return a point, not a direction. Anchors
 * use the full reference's projected bounds so sectioning never moves a center.
 */
export function getDrawingReferenceAnchor(
  points: vec3[],
  anchor: AssemblyDrawingDimensionAnchor = "center",
  viewMatrix: mat4,
  section: Parameters<typeof createOutlineSection>[1] | undefined,
  selector: string,
): vec3 {
  const projected = points.map((point) =>
    vec3.transformMat4(new Float64Array(3), point, viewMatrix),
  )
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]
  for (const point of projected)
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis]!, point[axis]!)
      max[axis] = Math.max(max[axis]!, point[axis]!)
    }
  const center = min.map((value, axis) => (value + max[axis]!) / 2)
  if (anchor === "left") center[0] = min[0]!
  if (anchor === "right") center[0] = max[0]!
  if (anchor === "bottom") center[1] = min[1]!
  if (anchor === "top") center[1] = max[1]!
  if (points.length === 1 && anchor !== "center")
    throw new Error(
      `Dimension reference "${selector}" is a hole center; use a center anchor`,
    )
  if (section) {
    const inverseView = mat4.invert(new Float64Array(16), viewMatrix)!
    const world = vec3.transformMat4(new Float64Array(3), center, inverseView)
    const sectionAxis = section.axis === "x" ? 0 : section.axis === "y" ? 1 : 2
    const distance = world[sectionAxis]! - section.offset
    if (section.keepSide === "less" ? distance > 1e-7 : distance < -1e-7)
      throw new Error(
        `Dimension reference "${selector}" has its ${anchor} anchor outside the retained section`,
      )
  }
  return center
}
