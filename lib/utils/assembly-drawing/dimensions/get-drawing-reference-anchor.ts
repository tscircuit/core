import type { AssemblyDrawingDimensionAnchor } from "@tscircuit/props"
import { mat4, vec3 } from "gl-matrix"
import type { createOutlineSection } from "poppygl"

/** Project glTF world points (right-handed +Y up, mm) into orthographic view
 * coordinates (+X right, +Y up, mm). Return a point, not a direction. Anchors
 * use the full reference's projected bounds so sectioning never moves a center.
 */
export function getDrawingReferenceAnchor(
  points: vec3[],
  anchor: AssemblyDrawingDimensionAnchor | undefined,
  viewMatrix: mat4,
  section: Parameters<typeof createOutlineSection>[1] | undefined,
  selector: string,
  oppositePoints: vec3[],
  axis?: "x" | "y",
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
  // An enclosing outline/board measures to its nearest boundary; disjoint
  // references (including two drill outlines) measure between their centers.
  // Bounds, rather than names such as "hole" or "rim", establish this relation.
  if (anchor === undefined && points.length > 1) {
    const opposite = oppositePoints.map((point) =>
      vec3.transformMat4(new Float64Array(3), point, viewMatrix),
    )
    const oppositeMin = [Infinity, Infinity],
      oppositeMax = [-Infinity, -Infinity]
    for (const point of opposite)
      for (let coordinate = 0; coordinate < 2; coordinate++) {
        oppositeMin[coordinate] = Math.min(
          oppositeMin[coordinate]!,
          point[coordinate]!,
        )
        oppositeMax[coordinate] = Math.max(
          oppositeMax[coordinate]!,
          point[coordinate]!,
        )
      }
    const enclosesOpposite =
      [0, 1].every(
        (coordinate) =>
          min[coordinate]! <= oppositeMin[coordinate]! + 1e-7 &&
          max[coordinate]! >= oppositeMax[coordinate]! - 1e-7,
      ) &&
      [0, 1].some(
        (coordinate) =>
          max[coordinate]! - min[coordinate]! >
          oppositeMax[coordinate]! - oppositeMin[coordinate]! + 1e-7,
      )
    if (enclosesOpposite) {
      const oppositeCenter = oppositeMin.map(
        (value, coordinate) => (value + oppositeMax[coordinate]!) / 2,
      )
      const candidates: {
        anchor: AssemblyDrawingDimensionAnchor
        axis: "x" | "y"
        distance: number
      }[] = [
        { anchor: "left", axis: "x", distance: oppositeCenter[0]! - min[0]! },
        { anchor: "right", axis: "x", distance: max[0]! - oppositeCenter[0]! },
        { anchor: "bottom", axis: "y", distance: oppositeCenter[1]! - min[1]! },
        { anchor: "top", axis: "y", distance: max[1]! - oppositeCenter[1]! },
      ]
      // Stable ties choose x before y, then left/bottom. Explicit axis restricts
      // candidates. Align the inferred witness with the opposite center so an
      // inferred edge distance stays perpendicular when axis is also omitted.
      anchor = candidates
        .filter((candidate) => !axis || candidate.axis === axis)
        .reduce((nearest, candidate) =>
          candidate.distance < nearest.distance - 1e-7 ? candidate : nearest,
        ).anchor
      center[0] = oppositeCenter[0]!
      center[1] = oppositeCenter[1]!
    }
  }
  anchor ??= "center"
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
