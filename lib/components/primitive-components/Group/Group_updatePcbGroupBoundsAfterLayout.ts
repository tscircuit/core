import { getBoundsCenter } from "@tscircuit/math-utils"
import type { SubcircuitGroupProps } from "@tscircuit/props"
import { getPostLayoutBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"
import type { Group } from "./Group"

export function Group_updatePcbGroupBoundsAfterLayout(
  group: Group<any>,
  pcbLayoutMode: "grid" | "flex" | "match-adapt" | "pack" | "none",
) {
  if (!group.pcb_group_id || group.root?.pcbDisabled) return

  const props = group._parsedProps as SubcircuitGroupProps
  if (props.outline?.length) return

  const postLayoutBounds = getPostLayoutBoundsOfPcbComponents(group.children)
  if (postLayoutBounds.width === 0 && postLayoutBounds.height === 0) return

  let width = postLayoutBounds.width
  let height = postLayoutBounds.height
  const postLayoutCenter = getBoundsCenter(postLayoutBounds)
  let centerX = postLayoutCenter.x
  let centerY = postLayoutCenter.y

  if (group.isSubcircuit) {
    const { padLeft, padRight, padTop, padBottom } = group._resolvePcbPadding()

    width += padLeft + padRight
    height += padTop + padBottom
    centerX += (padRight - padLeft) / 2
    centerY += (padTop - padBottom) / 2
  }

  const { db } = group.root!
  const existingPcbGroup = db.pcb_group.get(group.pcb_group_id)
  const preserveExplicitPosition = pcbLayoutMode === "none"

  db.pcb_group.update(group.pcb_group_id, {
    width: Number(props.width ?? width),
    height: Number(props.height ?? height),
    center: {
      x:
        props.width !== undefined ||
        (preserveExplicitPosition && props.pcbX !== undefined)
          ? (existingPcbGroup?.center.x ?? centerX)
          : centerX,
      y:
        props.height !== undefined ||
        (preserveExplicitPosition && props.pcbY !== undefined)
          ? (existingPcbGroup?.center.y ?? centerY)
          : centerY,
    },
  })
}
