import type { Group } from "./Group"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { length } from "circuit-json"

export function Group_doInitialSchematicLayoutGrid(group: Group<any>) {
  const { db } = group.root!
  const props = group._parsedProps

  // 1. Identify children with schematic components that are not explicitly positioned
  const schematicChildren = group.children.filter((child: any) => {
    const isExplicitlyPositioned =
      child._parsedProps?.schX !== undefined ||
      child._parsedProps?.schY !== undefined
    return child.schematic_component_id && !isExplicitlyPositioned
  }) as PrimitiveComponent[]

  if (schematicChildren.length === 0) return

  // 2. Determine schematic size of each child and max cell size
  let maxCellWidth = 0
  let maxCellHeight = 0

  for (const child of schematicChildren) {
    const schComp = db.schematic_component.get(child.schematic_component_id!)
    if (schComp?.size) {
      maxCellWidth = Math.max(maxCellWidth, schComp.size.width)
      maxCellHeight = Math.max(maxCellHeight, schComp.size.height)
    }
  }

  if (maxCellWidth === 0 && schematicChildren.length > 0) maxCellWidth = 1 // Default cell width if all children have no width
  if (maxCellHeight === 0 && schematicChildren.length > 0) maxCellHeight = 1 // Default cell height if all children have no height

  // 3. Get grid configuration (cols, rows, gap)
  let gridColsOption = props.gridCols
  let gridRowsOption: number | undefined = undefined // Not directly supported by old props, but can be via schLayout
  let gridGapOption = props.gridGap
  let gridRowGapOption = props.gridRowGap
  let gridColumnGapOption = props.gridColumnGap

  if (props.schLayout?.grid) {
    gridColsOption = props.schLayout.grid.cols ?? gridColsOption
    gridRowsOption = props.schLayout.grid.rows // New option from schLayout
    gridGapOption = props.schLayout.gridGap ?? gridGapOption
    gridRowGapOption = props.schLayout.gridRowGap ?? gridRowGapOption
    gridColumnGapOption = props.schLayout.gridColumnGap ?? gridColumnGapOption
  }

  let numCols: number
  let numRows: number

  if (gridColsOption !== undefined && gridRowsOption !== undefined) {
    numCols = gridColsOption
    numRows = gridRowsOption
  } else if (gridColsOption !== undefined) {
    numCols = gridColsOption
    numRows = Math.ceil(schematicChildren.length / numCols)
  } else if (gridRowsOption !== undefined) {
    numRows = gridRowsOption
    numCols = Math.ceil(schematicChildren.length / numRows)
  } else {
    // Default: try to make it squarish
    numCols = Math.ceil(Math.sqrt(schematicChildren.length))
    numRows = Math.ceil(schematicChildren.length / numCols)
  }

  if (numCols === 0 && schematicChildren.length > 0) numCols = 1
  if (numRows === 0 && schematicChildren.length > 0)
    numRows = schematicChildren.length

  let gridGapX: number
  let gridGapY: number

  const parseGap = (val: number | string | undefined): number | undefined => {
    if (val === undefined) return undefined
    return typeof val === "number" ? val : length.parse(val)
  }

  if (gridRowGapOption !== undefined || gridColumnGapOption !== undefined) {
    const fallbackX =
      typeof gridGapOption === "object" && gridGapOption !== null
        ? (gridGapOption as any).x
        : gridGapOption
    const fallbackY =
      typeof gridGapOption === "object" && gridGapOption !== null
        ? (gridGapOption as any).y
        : gridGapOption

    gridGapX = parseGap(gridColumnGapOption ?? fallbackX) ?? 1
    gridGapY = parseGap(gridRowGapOption ?? fallbackY) ?? 1
  } else if (typeof gridGapOption === "number") {
    gridGapX = gridGapOption
    gridGapY = gridGapOption
  } else if (typeof gridGapOption === "string") {
    const parsed = length.parse(gridGapOption)
    gridGapX = parsed
    gridGapY = parsed
  } else if (typeof gridGapOption === "object" && gridGapOption !== null) {
    const xRaw = (gridGapOption as any).x
    const yRaw = (gridGapOption as any).y
    gridGapX = typeof xRaw === "number" ? xRaw : length.parse(xRaw ?? "0mm")
    gridGapY = typeof yRaw === "number" ? yRaw : length.parse(yRaw ?? "0mm")
  } else {
    gridGapX = 1 // Default gap X
    gridGapY = 1 // Default gap Y
  }

  // 4. Calculate total grid dimensions
  const totalGridWidth =
    numCols * maxCellWidth + Math.max(0, numCols - 1) * gridGapX
  const totalGridHeight =
    numRows * maxCellHeight + Math.max(0, numRows - 1) * gridGapY

  // 5. Get group's center position (this is where the grid will be centered)
  const groupCenter = group._getGlobalSchematicPositionBeforeLayout()

  // 6. Calculate starting position (center of the first cell [0,0])
  // This is the top-left cell's center.
  const firstCellCenterX = groupCenter.x - totalGridWidth / 2 + maxCellWidth / 2
  const firstCellCenterY =
    groupCenter.y + totalGridHeight / 2 - maxCellHeight / 2

  // 7. Position each child
  for (let i = 0; i < schematicChildren.length; i++) {
    const child = schematicChildren[i]
    if (!child.schematic_component_id) continue

    const row = Math.floor(i / numCols)
    const col = i % numCols

    if (row >= numRows || col >= numCols) {
      console.warn(
        `Schematic grid layout: Child ${child.getString()} at index ${i} (row ${row}, col ${col}) exceeds specified grid dimensions (${numRows}x${numCols}). Skipping placement.`,
      )
      continue
    }

    const targetCellCenterX = firstCellCenterX + col * (maxCellWidth + gridGapX)
    const targetCellCenterY =
      firstCellCenterY - row * (maxCellHeight + gridGapY)

    const schComp = db.schematic_component.get(child.schematic_component_id!)
    if (schComp) {
      const oldChildCenter = schComp.center
      const newChildCenter = { x: targetCellCenterX, y: targetCellCenterY }

      db.schematic_component.update(child.schematic_component_id!, {
        center: newChildCenter,
      })

      const deltaX = newChildCenter.x - oldChildCenter.x
      const deltaY = newChildCenter.y - oldChildCenter.y

      const schPorts = db.schematic_port.list({
        schematic_component_id: child.schematic_component_id!,
      })
      for (const port of schPorts) {
        db.schematic_port.update(port.schematic_port_id, {
          center: { x: port.center.x + deltaX, y: port.center.y + deltaY },
        })
      }

      const schTexts = db.schematic_text.list({
        schematic_component_id: child.schematic_component_id!,
      })
      for (const text of schTexts) {
        db.schematic_text.update(text.schematic_text_id, {
          position: {
            x: text.position.x + deltaX,
            y: text.position.y + deltaY,
          },
        })
      }
    }
  }

  // 8. Update the group's schematic_group size
  if (group.schematic_group_id) {
    db.schematic_group.update(group.schematic_group_id, {
      width: totalGridWidth,
      height: totalGridHeight,
      center: groupCenter,
    })
  }
}
