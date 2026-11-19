import type { ManufacturingSurfacePlacementProps } from "@tscircuit/props"
import type { AssemblyPartSurface } from "./resolve-assembly-part-surface"

type ParsedSurfacePlacement = {
  [K in keyof ManufacturingSurfacePlacementProps]?: K extends
    | "surfaceRef"
    | "anchorAlignment"
    ? ManufacturingSurfacePlacementProps[K]
    : number
}

/** Place a rectangular mark on a surface. The result is in the surface's own
 * frame, seen from outside the part, in mm: origin at the surface center, +X
 * along the surface's X direction, +Y along normal × X. `rotation` is radians
 * counterclockwise. Edge distances and anchors measure the rotated mark's
 * bounds.
 */
export const resolveSurfaceMarkPlacement = ({
  placement,
  markWidth,
  markHeight,
  surface,
  markDescription,
}: {
  placement: ParsedSurfacePlacement
  /** Mark size before rotation, mm. */
  markWidth: number
  markHeight: number
  surface: AssemblyPartSurface
  /** Names the mark in errors, e.g. `Sticker "LABEL"`. */
  markDescription: string
}) => {
  const rotation = ((placement.rotationOnSurface ?? 0) * Math.PI) / 180
  const [cos, sin] = [
    Math.abs(Math.cos(rotation)),
    Math.abs(Math.sin(rotation)),
  ]
  const halfBoundsWidth = (markWidth * cos + markHeight * sin) / 2
  const halfBoundsHeight = (markWidth * sin + markHeight * cos) / 2
  const anchor = placement.anchorAlignment ?? "center"

  const fromEdge = (
    prop: keyof ParsedSurfacePlacement,
    surfaceSize: number | undefined,
  ) => {
    if (surfaceSize === undefined)
      throw new Error(
        `${markDescription} uses ${prop}, but surface "${surface.frame.name}" has no known size. Give the reference surface a width and height, or position from the surface center`,
      )
    return surfaceSize / 2
  }

  let x = placement.xOffsetFromSurfaceCenter ?? 0
  if (placement.distanceFromSurfaceLeftEdge !== undefined)
    x =
      -fromEdge("distanceFromSurfaceLeftEdge", surface.width) +
      placement.distanceFromSurfaceLeftEdge +
      halfBoundsWidth
  else if (placement.distanceFromSurfaceRightEdge !== undefined)
    x =
      fromEdge("distanceFromSurfaceRightEdge", surface.width) -
      placement.distanceFromSurfaceRightEdge -
      halfBoundsWidth
  else if (anchor.includes("left")) x += halfBoundsWidth
  else if (anchor.includes("right")) x -= halfBoundsWidth

  let y = placement.yOffsetFromSurfaceCenter ?? 0
  if (placement.distanceFromSurfaceTopEdge !== undefined)
    y =
      fromEdge("distanceFromSurfaceTopEdge", surface.height) -
      placement.distanceFromSurfaceTopEdge -
      halfBoundsHeight
  else if (placement.distanceFromSurfaceBottomEdge !== undefined)
    y =
      -fromEdge("distanceFromSurfaceBottomEdge", surface.height) +
      placement.distanceFromSurfaceBottomEdge +
      halfBoundsHeight
  else if (anchor.includes("top")) y -= halfBoundsHeight
  else if (anchor.includes("bottom")) y += halfBoundsHeight

  return { x, y, rotation }
}
