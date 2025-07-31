import type { Group } from "./Group"
import { layoutCircuitJsonWithFlex } from "@tscircuit/circuit-json-flex"
import type { PcbSmtPad, PcbSilkscreenText, Size } from "circuit-json"
import {
  getCircuitJsonTree,
  repositionPcbComponentTo,
  type CircuitJsonUtilObjects,
} from "@tscircuit/circuit-json-util"
import { RootFlexBox, type Align, type Justify } from "@tscircuit/miniflex"
import { getMinimumFlexContainer } from "@tscircuit/circuit-json-flex"

type TreeNode = ReturnType<typeof getCircuitJsonTree>
export const getSizeOfTreeNodeChild = (
  db: CircuitJsonUtilObjects,
  child: TreeNode,
) => {
  const { sourceComponent, sourceGroup } = child
  if (child.nodeType === "component") {
    const pcbComponent = db.pcb_component.getWhere({
      source_component_id: sourceComponent?.source_component_id,
    })
    if (!pcbComponent) return null
    return {
      width: pcbComponent.width,
      height: pcbComponent.height,
    }
  }
  if (child.nodeType === "group") {
    const pcbGroup = db.pcb_group.getWhere({
      source_group_id: sourceGroup?.source_group_id,
    })
    if (!pcbGroup) return null
    return {
      width: pcbGroup.width,
      height: pcbGroup.height,
    }
  }
  return null
}

export const Group_doInitialPcbLayoutFlex = (group: Group) => {
  const { db } = group.root!
  const { _parsedProps: props } = group

  const tree = getCircuitJsonTree(db.toArray(), {
    source_group_id: group.source_group_id!,
  })
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
  }

  let minFlexContainer: Size | undefined
  let width = props.width ?? props.pcbWidth ?? undefined
  let height = props.height ?? props.pcbHeight ?? undefined
  const isInline = Boolean(width === undefined || height === undefined)

  if (isInline) {
    minFlexContainer = getMinimumFlexContainer(
      tree.childNodes
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

  for (const child of tree.childNodes) {
    const size = getSizeOfTreeNodeChild(db, child)
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

  // console.table(
  //   flexBox.children.map((child) => [
  //     child.metadata.sourceComponent?.name,
  //     child.position.x,
  //     child.position.y,
  //     child.size.width,
  //     child.size.height,
  //   ]),
  // )

  const allCircuitJson = db.toArray()

  for (const child of flexBox.children) {
    const { sourceComponent, sourceGroup } = child.metadata as Pick<
      TreeNode,
      "sourceComponent" | "sourceGroup"
    >
    if (sourceComponent) {
      const pcbComponent = db.pcb_component.getWhere({
        source_component_id: sourceComponent.source_component_id,
      })
      if (!pcbComponent) continue

      repositionPcbComponentTo(allCircuitJson, pcbComponent.pcb_component_id, {
        x: child.position.x + child.size.width / 2,
        y: child.position.y + child.size.height / 2,
      })
    }
    if (sourceGroup) {
      const pcbGroup = db.pcb_group.getWhere({
        source_group_id: sourceGroup.source_group_id,
      })
      if (!pcbGroup) continue
    }
  }
}
