import type { Group } from "./Group"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export function Group_doInitialSchematicLayoutFlex(group: Group<any>) {
  const { db } = group.root!
  const props = group._parsedProps as any

  const schematicChildren = group.children.filter(
    (c) => c.schematic_component_id,
  ) as PrimitiveComponent[]

  if (schematicChildren.length === 0) return

  const flexDirection =
    props.schLayout?.flexDirection ??
    props.flexDirection ??
    (props.flexRow ? "row" : props.flexColumn ? "column" : "row")

  const gapOption = props.schLayout?.gap ?? props.gap
  let gap = 1
  if (typeof gapOption === "number") gap = gapOption
  else if (typeof gapOption === "object" && gapOption !== null) {
    gap = flexDirection === "row" ? gapOption.x : gapOption.y
  }

  const childSizes = schematicChildren.map((child) => {
    const comp = db.schematic_component.get(child.schematic_component_id!)
    return {
      width: comp?.size?.width ?? 1,
      height: comp?.size?.height ?? 1,
    }
  })

  const groupCenter = group._getGlobalSchematicPositionBeforeLayout()

  if (flexDirection === "row") {
    const totalWidth =
      childSizes.reduce((s, c) => s + c.width, 0) + gap * (childSizes.length - 1)
    let currentX = groupCenter.x - totalWidth / 2
    const maxHeight = Math.max(...childSizes.map((s) => s.height))

    schematicChildren.forEach((child, i) => {
      const size = childSizes[i]
      currentX += size.width / 2
      const newCenter = { x: currentX, y: groupCenter.y }

      const schComp = db.schematic_component.get(child.schematic_component_id!)
      if (schComp) {
        const deltaX = newCenter.x - schComp.center.x
        const deltaY = newCenter.y - schComp.center.y
        db.schematic_component.update(child.schematic_component_id!, {
          center: newCenter,
        })
        const ports = db.schematic_port.list({
          schematic_component_id: child.schematic_component_id!,
        })
        for (const port of ports) {
          db.schematic_port.update(port.schematic_port_id, {
            center: { x: port.center.x + deltaX, y: port.center.y + deltaY },
          })
        }
        const texts = db.schematic_text.list({
          schematic_component_id: child.schematic_component_id!,
        })
        for (const text of texts) {
          db.schematic_text.update(text.schematic_text_id, {
            position: {
              x: text.position.x + deltaX,
              y: text.position.y + deltaY,
            },
          })
        }
      }
      currentX += size.width / 2 + gap
    })

    if (group.schematic_group_id) {
      db.schematic_group.update(group.schematic_group_id, {
        width: totalWidth,
        height: maxHeight,
        center: groupCenter,
      })
    }
  } else {
    const totalHeight =
      childSizes.reduce((s, c) => s + c.height, 0) + gap * (childSizes.length - 1)
    let currentY = groupCenter.y + totalHeight / 2
    const maxWidth = Math.max(...childSizes.map((s) => s.width))

    schematicChildren.forEach((child, i) => {
      const size = childSizes[i]
      currentY -= size.height / 2
      const newCenter = { x: groupCenter.x, y: currentY }

      const schComp = db.schematic_component.get(child.schematic_component_id!)
      if (schComp) {
        const deltaX = newCenter.x - schComp.center.x
        const deltaY = newCenter.y - schComp.center.y
        db.schematic_component.update(child.schematic_component_id!, {
          center: newCenter,
        })
        const ports = db.schematic_port.list({
          schematic_component_id: child.schematic_component_id!,
        })
        for (const port of ports) {
          db.schematic_port.update(port.schematic_port_id, {
            center: { x: port.center.x + deltaX, y: port.center.y + deltaY },
          })
        }
        const texts = db.schematic_text.list({
          schematic_component_id: child.schematic_component_id!,
        })
        for (const text of texts) {
          db.schematic_text.update(text.schematic_text_id, {
            position: {
              x: text.position.x + deltaX,
              y: text.position.y + deltaY,
            },
          })
        }
      }
      currentY -= size.height / 2 + gap
    })

    if (group.schematic_group_id) {
      db.schematic_group.update(group.schematic_group_id, {
        width: maxWidth,
        height: totalHeight,
        center: groupCenter,
      })
    }
  }
}
