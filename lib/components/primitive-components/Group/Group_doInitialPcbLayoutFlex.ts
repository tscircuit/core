import { getMinimumFlexContainer } from "@tscircuit/circuit-json-util"
import { type Align, type Justify, RootFlexBox } from "@tscircuit/miniflex"
import type { Size } from "circuit-json"
import { length } from "circuit-json"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import type { Group } from "./Group"
import type { IGroup } from "./IGroup"

type PcbChild = NormalComponent | IGroup

export const Group_doInitialPcbLayoutFlex = (group: Group) => {
  const { db } = group.root!
  const { _parsedProps: props } = group

  // Use group.children to preserve authored order
  const pcbChildren: PcbChild[] = group.children.filter(
    (c) => c.pcb_component_id || (c as IGroup).pcb_group_id,
  ) as PcbChild[]

  // If any child has explicit pcbX/pcbY, skip flex layout entirely to honor manual placement
  const anyChildHasExplicitPcbPosition = pcbChildren.some((child) => {
    const childProps = (child as any)._parsedProps as
      | { pcbX?: number; pcbY?: number }
      | undefined
    return childProps?.pcbX !== undefined || childProps?.pcbY !== undefined
  })
  if (anyChildHasExplicitPcbPosition) {
    return
  }
  const rawJustify = props.pcbJustifyContent ?? props.justifyContent
  const rawAlign = props.pcbAlignItems ?? props.alignItems
  const rawGap = props.pcbFlexGap ?? props.pcbGap ?? props.gap
  const direction = props.pcbFlexDirection ?? "row"

  const justifyContent = {
    start: "flex-start",
    end: "flex-end",
    "flex-start": "flex-start",
    "flex-end": "flex-end",
    stretch: "space-between",
    "space-between": "space-between",
    "space-around": "space-around",
    "space-evenly": "space-evenly",
    center: "center",
  }[rawJustify ?? "space-between"]

  const alignItems = {
    start: "flex-start",
    end: "flex-end",
    "flex-start": "flex-start",
    "flex-end": "flex-end",
    stretch: "stretch",
    center: "center",
  }[rawAlign ?? "center"]

  if (!justifyContent) {
    throw new Error(`Invalid justifyContent value: "${rawJustify}"`)
  }
  if (!alignItems) {
    throw new Error(`Invalid alignItems value: "${rawAlign}"`)
  }

  let rowGap = 0
  let columnGap = 0
  if (typeof rawGap === "object") {
    rowGap = (rawGap as any).y ?? 0
    columnGap = (rawGap as any).x ?? 0
  } else if (typeof rawGap === "number") {
    rowGap = rawGap
    columnGap = rawGap
  } else if (typeof rawGap === "string") {
    rowGap = length.parse(rawGap)
    columnGap = length.parse(rawGap)
  }

  let minFlexContainer: Size | undefined
  let width = props.width ?? props.pcbWidth ?? undefined
  let height = props.height ?? props.pcbHeight ?? undefined

  if (width === undefined) {
    const parentGroup = group.parent?.getGroup?.()

    if (parentGroup) {
      const parentWidthFromProps =
        parentGroup._parsedProps?.width ?? parentGroup._parsedProps?.pcbWidth

      if (typeof parentWidthFromProps === "number") {
        width = parentWidthFromProps
      }
    }
  }

  // For flex groups, always calculate the container size to include gaps properly
  // Don't use existing group dimensions as they may not account for current gap settings
  const isInline = Boolean(width === undefined || height === undefined)

  if (isInline) {
    minFlexContainer = getMinimumFlexContainer(
      pcbChildren
        .map((child) => child._getMinimumFlexContainerSize())
        .filter((size) => size !== null),
      {
        alignItems: alignItems as Align,
        justifyContent: justifyContent as Justify,
        direction: direction,
        rowGap,
        columnGap,
      },
    )
    if (width === undefined) {
      width = minFlexContainer.width
    }
    if (height === undefined) {
      height = minFlexContainer.height
    }
  }

  const flexBox = new RootFlexBox(width!, height!, {
    alignItems: alignItems as Align,
    justifyContent: justifyContent as Justify,
    direction: direction,
    rowGap,
    columnGap,
  })

  for (const child of pcbChildren) {
    const size = child._getMinimumFlexContainerSize()
    flexBox.addChild({
      metadata: child,

      // TODO these should be minWidth/minHeight
      width: size?.width ?? 0,
      height: size?.height ?? 0,

      // TODO allow overriding flexBasis
      flexBasis: !size
        ? undefined
        : direction === "row"
          ? size.width
          : size.height,
      // TODO alignSelf, flexGrow, flexShrink etc.
    })
  }

  flexBox.build()

  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    width: 0,
    height: 0,
  }
  for (const child of flexBox.children) {
    bounds.minX = Math.min(bounds.minX, child.position.x)
    bounds.minY = Math.min(bounds.minY, child.position.y)
    bounds.maxX = Math.max(bounds.maxX, child.position.x + child.size.width)
    bounds.maxY = Math.max(bounds.maxY, child.position.y + child.size.height)
  }
  bounds.width = bounds.maxX - bounds.minX
  bounds.height = bounds.maxY - bounds.minY

  const groupCenter = group._getGlobalPcbPositionBeforeLayout()
  const offset = {
    x: groupCenter.x - (bounds.maxX + bounds.minX) / 2,
    y: groupCenter.y - (bounds.maxY + bounds.minY) / 2,
  }

  for (const child of flexBox.children) {
    const childMetadata = child.metadata as PcbChild
    childMetadata._repositionOnPcb({
      x: child.position.x + child.size.width / 2 + offset.x,
      y: child.position.y + child.size.height / 2 + offset.y,
    })
  }

  // Set the new group size
  db.pcb_group.update(group.pcb_group_id!, {
    width: bounds.width,
    height: bounds.height,
    center: groupCenter,
  })
}
