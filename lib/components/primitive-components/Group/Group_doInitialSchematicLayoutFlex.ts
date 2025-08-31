import type { Group } from "./Group"
import type { Size } from "circuit-json"
import {
  getCircuitJsonTree,
  getMinimumFlexContainer,
  repositionSchematicComponentTo,
  repositionSchematicGroupTo,
  type CircuitJsonUtilObjects,
} from "@tscircuit/circuit-json-util"
import { RootFlexBox, type Align, type Justify } from "@tscircuit/miniflex"
import { length } from "circuit-json"

type TreeNode = ReturnType<typeof getCircuitJsonTree>

const getSizeOfTreeNodeChild = (
  db: CircuitJsonUtilObjects,
  child: TreeNode,
) => {
  const { sourceComponent, sourceGroup } = child
  if (child.nodeType === "component") {
    const schComponent = db.schematic_component.getWhere({
      source_component_id: sourceComponent?.source_component_id,
    })
    if (!schComponent?.size) return null
    return {
      width: schComponent.size.width,
      height: schComponent.size.height,
    }
  }
  if (child.nodeType === "group") {
    const schGroup = db.schematic_group.getWhere({
      source_group_id: sourceGroup?.source_group_id,
    })

    // If the group already has a calculated size, use it
    if (schGroup?.width && schGroup?.height) {
      return {
        width: schGroup.width,
        height: schGroup.height,
      }
    }

    // Otherwise, calculate the bounding box from components within the group
    const groupComponents = db.schematic_component.list({
      schematic_group_id: schGroup?.schematic_group_id,
    })

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const comp of groupComponents) {
      if (comp.center && comp.size) {
        const halfWidth = comp.size.width / 2
        const halfHeight = comp.size.height / 2
        minX = Math.min(minX, comp.center.x - halfWidth)
        maxX = Math.max(maxX, comp.center.x + halfWidth)
        minY = Math.min(minY, comp.center.y - halfHeight)
        maxY = Math.max(maxY, comp.center.y + halfHeight)
      }
    }

    const groupWidth = maxX - minX
    const groupHeight = maxY - minY

    return {
      width: groupWidth,
      height: groupHeight,
    }
  }
  return null
}

export const Group_doInitialSchematicLayoutFlex = (group: Group) => {
  const { db } = group.root!
  const props = group._parsedProps

  const tree = getCircuitJsonTree(db.toArray(), {
    source_group_id: group.source_group_id!,
  })

  // Filter out children with explicit schematic coordinates
  const treeChildren = tree.childNodes.filter((child) => {
    if (child.nodeType === "component" && child.sourceComponent) {
      const instance = group.children.find(
        (c: any) =>
          c.source_component_id === child.sourceComponent?.source_component_id,
      )
      const cProps = (instance as any)?._parsedProps
      return cProps?.schX === undefined && cProps?.schY === undefined
    }
    if (child.nodeType === "group" && child.sourceGroup) {
      const instance = group.children.find(
        (g: any) => g.source_group_id === child.sourceGroup?.source_group_id,
      )
      const gProps = (instance as any)?._parsedProps
      return gProps?.schX === undefined && gProps?.schY === undefined
    }
    return true
  })
  const rawJustify = props.schJustifyContent ?? props.justifyContent
  const rawAlign = props.schAlignItems ?? props.alignItems
  const rawGap = props.schFlexGap ?? props.schGap ?? props.gap
  const direction = props.schFlexDirection ?? "row"

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
  let width = props.width ?? props.schWidth ?? undefined
  let height = props.height ?? props.schHeight ?? undefined
  const isInline = Boolean(width === undefined || height === undefined)

  if (isInline) {
    minFlexContainer = getMinimumFlexContainer(
      treeChildren
        .map((child) => getSizeOfTreeNodeChild(db, child))
        .filter((size) => size !== null),
      {
        alignItems: alignItems as Align,
        justifyContent: justifyContent as Justify,
        direction: direction,
        rowGap,
        columnGap,
      },
    )
    width = minFlexContainer.width
    height = minFlexContainer.height
  }

  const flexBox = new RootFlexBox(width!, height!, {
    alignItems: alignItems as Align,
    justifyContent: justifyContent as Justify,
    direction: direction,
    rowGap,
    columnGap,
  })

  for (const child of treeChildren) {
    const size = getSizeOfTreeNodeChild(db, child)
    flexBox.addChild({
      metadata: child,
      width: size?.width ?? 0,
      height: size?.height ?? 0,
      flexBasis: !size
        ? undefined
        : direction === "row"
          ? size.width
          : size.height,
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

  const offset = {
    x: -(bounds.maxX + bounds.minX) / 2,
    y: -(bounds.maxY + bounds.minY) / 2,
  }

  const allCircuitJson = db.toArray()

  for (const child of flexBox.children) {
    const { sourceComponent, sourceGroup } = child.metadata as Pick<
      TreeNode,
      "sourceComponent" | "sourceGroup"
    >
    if (sourceComponent) {
      const schComponent = db.schematic_component.getWhere({
        source_component_id: sourceComponent.source_component_id,
      })
      if (!schComponent) continue
      repositionSchematicComponentTo(
        allCircuitJson,
        schComponent.schematic_component_id,
        {
          x: child.position.x + child.size.width / 2 + offset.x,
          y: child.position.y + child.size.height / 2 + offset.y,
        },
      )
    }
    if (sourceGroup) {
      const schGroup = db.schematic_group.getWhere({
        source_group_id: sourceGroup.source_group_id,
      })
      if (!schGroup) continue
      repositionSchematicGroupTo(allCircuitJson, sourceGroup.source_group_id, {
        x: child.position.x + child.size.width / 2 + offset.x,
        y: child.position.y + child.size.height / 2 + offset.y,
      })
    }
  }

  if (group.schematic_group_id) {
    db.schematic_group.update(group.schematic_group_id, {
      width: bounds.width,
      height: bounds.height,
    })
  }
}

export { getSizeOfTreeNodeChild }
