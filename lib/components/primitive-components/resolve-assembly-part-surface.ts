import jscadModeling from "@jscad/modeling"
import { manufacturingBuiltInSurfaces } from "@tscircuit/props"
import {
  executeJscadOperations,
  type NamedReferencePlane,
  type Vector3D,
} from "jscad-planner"
import type { AssemblyPart } from "./AssemblyPart"
import type { AssemblyPrintedPart } from "./AssemblyPrintedPart"
import type { AssemblyReferenceSurface } from "./AssemblyReferenceSurface"
import { getPartReferenceSurfaces } from "./get-part-reference-surfaces"

type BuiltInSurface = (typeof manufacturingBuiltInSurfaces)[number]

/** A surface something can be applied to, in the part's local, right-handed
 * XYZ, mm. `frame.origin` is the surface's center point; `frame.normal` points
 * out of the part and `frame.xAxis` is the surface's in-plane X, both unit
 * directions. Surface +Y is normal × xAxis. `width` and `height` are the
 * extents along surface X and Y, absent when the surface's size is unknown.
 */
export interface AssemblyPartSurface {
  frame: NamedReferencePlane
  width?: number
  height?: number
}

// Outward normal and in-plane X of each bounding surface, matching the props
// contract: the four sides are upright (surface +Y is part +Z); top and bottom
// have surface +X along part +X.
const builtInSurfaceAxes: Record<
  BuiltInSurface,
  { normal: Vector3D; xAxis: Vector3D }
> = {
  topSurface: { normal: [0, 0, 1], xAxis: [1, 0, 0] },
  bottomSurface: { normal: [0, 0, -1], xAxis: [1, 0, 0] },
  rightSurface: { normal: [1, 0, 0], xAxis: [0, 1, 0] },
  leftSurface: { normal: [-1, 0, 0], xAxis: [0, -1, 0] },
  backSurface: { normal: [0, 1, 0], xAxis: [-1, 0, 0] },
  frontSurface: { normal: [0, -1, 0], xAxis: [1, 0, 0] },
}

const cross = (a: Vector3D, b: Vector3D): Vector3D => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

/** Part-local model bounds in mm, known only for a printed part authored with
 * JSCAD. Imported models are not loaded during render.
 */
const getPartModelBounds = (part: AssemblyPart | AssemblyPrintedPart) => {
  if (part.componentName !== "AssemblyPrintedPart") return undefined
  const plan = (part as AssemblyPrintedPart).printedPartPlan
  if (!plan) return undefined
  const solids = [
    executeJscadOperations(jscadModeling as any, plan.geometry as any),
  ].flat(Infinity)
  const [min, max] = jscadModeling.measurements.measureAggregateBoundingBox(
    ...(solids as any[]),
  ) as [Vector3D, Vector3D]
  return { min, max }
}

/** Resolve `surfaceRef` on a part: a reference surface it names, otherwise one
 * of its built-in bounding surfaces.
 */
export const resolveAssemblyPartSurface = (
  part: AssemblyPart | AssemblyPrintedPart,
  surfaceRef: string,
): AssemblyPartSurface => {
  const references = getPartReferenceSurfaces(part)
  const frame = references.find((surface) => surface.name === surfaceRef)
  if (frame) {
    const authored = part.children.find(
      (child): child is AssemblyReferenceSurface =>
        child.componentName === "AssemblyReferenceSurface" &&
        child.name === surfaceRef,
    )
    return {
      frame,
      width: authored?._parsedProps.width,
      height: authored?._parsedProps.height,
    }
  }

  const axes = builtInSurfaceAxes[surfaceRef as BuiltInSurface]
  if (!axes) {
    const known = [
      ...references.map((surface) => surface.name),
      ...manufacturingBuiltInSurfaces,
    ]
    throw new Error(
      `Part "${part.name}" has no surface "${surfaceRef}". Use one of: ${known.join(", ")}`,
    )
  }
  const bounds = getPartModelBounds(part)
  if (!bounds)
    throw new Error(
      `"${surfaceRef}" needs the bounds of part "${part.name}", which are only known for a printed part authored with jscad. Add an assembly.referencesurface to the part and reference it by name`,
    )
  const { normal, xAxis } = axes
  const yAxis = cross(normal, xAxis)
  const size = bounds.max.map((value, i) => value - bounds.min[i]!) as Vector3D
  const extentAlong = (axis: Vector3D) =>
    Math.abs(axis[0]) * size[0] +
    Math.abs(axis[1]) * size[1] +
    Math.abs(axis[2]) * size[2]
  return {
    frame: {
      name: surfaceRef,
      origin: bounds.min.map(
        (value, i) =>
          (value + bounds.max[i]!) / 2 + (normal[i]! * size[i]!) / 2,
      ) as Vector3D,
      normal,
      xAxis,
    },
    width: extentAlong(xAxis),
    height: extentAlong(yAxis),
  }
}
