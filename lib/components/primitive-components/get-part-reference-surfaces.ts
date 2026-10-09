import {
  resolveReferencePlanes,
  type JscadOperation,
  type NamedReferencePlane,
} from "jscad-planner"
import type { AssemblyPart } from "./AssemblyPart"
import type { AssemblyPrintedPart } from "./AssemblyPrintedPart"
import type { AssemblyReferenceSurface } from "./AssemblyReferenceSurface"

/** Collect part-local mounting frames (mm, right-handed XYZ) without producing
 * solid geometry. Child frames share the part origin, not its CAD model offsets.
 */
export const getPartReferenceSurfaces = (
  part: AssemblyPart | AssemblyPrintedPart,
): NamedReferencePlane[] => {
  const model = part._parsedProps.cadModel
  const authored =
    part.componentName === "AssemblyPrintedPart"
      ? ((part as AssemblyPrintedPart).printedPartPlan?.referencePlanes ??
        (model && typeof model === "object" && "jscad" in model
          ? resolveReferencePlanes(model.jscad as JscadOperation)
              .referencePlanes
          : []))
      : []
  const surfaces = [
    ...authored,
    ...part.children
      .filter(
        (child): child is AssemblyReferenceSurface =>
          child.componentName === "AssemblyReferenceSurface",
      )
      .map((child) => child.referenceFrame),
  ]
  const names = new Set<string>()
  for (const surface of surfaces) {
    if (names.has(surface.name))
      throw new Error(
        `Part "${part.name}" has duplicate reference surface "${surface.name}"`,
      )
    names.add(surface.name)
  }
  return surfaces
}
