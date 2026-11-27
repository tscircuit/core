import type { GroupProps } from "@tscircuit/props"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { extractCalcIdentifiers } from "lib/utils/evaluateCalcString"
import {
  type Matrix,
  applyToPoint,
  compose,
  flipY,
} from "transformation-matrix"

/** Reflects group-local PCB points across the Y axis in right-handed mm
 * (+X right, +Y top, +Z above the board before the side flip). */
const pcbGroupSideReflection = flipY()

function hasEdgeOrAnchorPlacement(
  props: Pick<
    GroupProps,
    | "pcbLeftEdgeX"
    | "pcbRightEdgeX"
    | "pcbTopEdgeY"
    | "pcbBottomEdgeY"
    | "pcbPositionAnchor"
    | "pcbAnchorAlignment"
  >,
): boolean {
  return (
    props.pcbLeftEdgeX !== undefined ||
    props.pcbRightEdgeX !== undefined ||
    props.pcbTopEdgeY !== undefined ||
    props.pcbBottomEdgeY !== undefined ||
    props.pcbPositionAnchor !== undefined ||
    props.pcbAnchorAlignment !== undefined
  )
}

function groupRequestsPcbSideFlip(group: PrimitiveComponent): boolean {
  return (
    group.componentName === "Group" &&
    group._parsedProps.layer === "bottom" &&
    !hasEdgeOrAnchorPlacement(group.props)
  )
}

function isDirectPcbGroupMember(member: PrimitiveComponent): boolean {
  return "_isNormalComponent" in member && !member.isGroup
}

function usesComponentRelativeCalc(coordinate: string): boolean {
  try {
    return extractCalcIdentifiers(coordinate).some(
      (identifier) => !identifier.startsWith("board."),
    )
  } catch {
    // Coordinate validation reports invalid expressions.
    return false
  }
}

export function findPcbGroupMemberWithUnsupportedPlacement(
  group: PrimitiveComponent,
): PrimitiveComponent | undefined {
  if (!groupRequestsPcbSideFlip(group)) return undefined
  return group.children.find((member) => {
    const props = member._parsedProps
    return [
      props.pcbX,
      props.pcbY,
      props.pcbLeftEdgeX,
      props.pcbRightEdgeX,
      props.pcbTopEdgeY,
      props.pcbBottomEdgeY,
    ].some(
      (coordinate) =>
        typeof coordinate === "string" &&
        (usesComponentRelativeCalc(coordinate) ||
          isDirectPcbGroupMember(member)),
    )
  })
}

export function shouldFlipPcbGroupMember(member: PrimitiveComponent): boolean {
  const group = member.parent
  return (
    group !== null &&
    groupRequestsPcbSideFlip(group) &&
    isDirectPcbGroupMember(member) &&
    !hasEdgeOrAnchorPlacement(member.props) &&
    !findPcbGroupMemberWithUnsupportedPlacement(group)
  )
}

/**
 * Maps member-local points to group-local points in right-handed PCB mm
 * (+X right, +Y toward the top, +Z above).
 */
export function reflectPcbGroupMemberPlacement(
  member: PrimitiveComponent,
  placement: Matrix,
): Matrix {
  if (!shouldFlipPcbGroupMember(member)) return placement
  // The footprint gets its own side flip in the isPcbPrimitive branch of
  // PrimitiveComponent._computePcbGlobalTransformBeforeLayout.
  return compose(pcbGroupSideReflection, placement, pcbGroupSideReflection)
}

/**
 * Resolves a group's member X offset, in the same group-local PCB point frame
 * as reflectPcbGroupMemberPlacement (right-handed mm, +X right, +Y top, +Z above).
 */
export function reflectPcbGroupMemberX(
  member: PrimitiveComponent,
  x: number,
): number {
  return shouldFlipPcbGroupMember(member)
    ? applyToPoint(pcbGroupSideReflection, { x, y: 0 }).x
    : x
}
