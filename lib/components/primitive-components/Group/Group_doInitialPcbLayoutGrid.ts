import type { Group } from "./Group"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { IGroup } from "./IGroup"
import {
  repositionPcbComponentTo,
  repositionPcbGroupTo,
} from "@tscircuit/circuit-json-util"
import { length } from "circuit-json"
import { CssGrid } from "minicssgrid"

export function Group_doInitialPcbLayoutGrid(group: Group<any>) {
  const { db } = group.root!
  const props = group._parsedProps

  const pcbChildren = group.children.filter(
    (child) => child.pcb_component_id || (child as IGroup).pcb_group_id,
  ) as (PrimitiveComponent | IGroup)[]

  if (pcbChildren.length === 0) return

  let childWidth = 0
  let childHeight = 0

  for (const child of pcbChildren) {
    let width = 0
    let height = 0

    if ((child as IGroup).pcb_group_id) {
      const pcbGroup = db.pcb_group.get((child as IGroup).pcb_group_id!)
      width = pcbGroup?.width ?? 0
      height = pcbGroup?.height ?? 0
    } else if (child.pcb_component_id) {
      const pcbComp = db.pcb_component.get(child.pcb_component_id!)
      width = pcbComp?.width ?? 0
      height = pcbComp?.height ?? 0
    }
    childWidth = Math.max(childWidth, width)
    childHeight = Math.max(childHeight, height)
  }

  if (childWidth === 0 && pcbChildren.length > 0) childWidth = 1
  if (childHeight === 0 && pcbChildren.length > 0) childHeight = 1

  // Extract grid configuration from props
  let gridColsOption = props.pcbGridCols ?? props.gridCols
  let gridRowsOption: number | undefined = props.pcbGridRows
  let gridGapOption = props.pcbGridGap ?? props.gridGap
  let gridRowGapOption = props.pcbGridRowGap ?? props.gridRowGap
  let gridColumnGapOption = props.pcbGridColumnGap ?? props.gridColumnGap

  if (props.pcbLayout?.grid) {
    gridColsOption = props.pcbLayout.grid.cols ?? gridColsOption
    gridRowsOption = props.pcbLayout.grid.rows
    gridGapOption = props.pcbLayout.gridGap ?? gridGapOption
    gridRowGapOption = props.pcbLayout.gridRowGap ?? gridRowGapOption
    gridColumnGapOption = props.pcbLayout.gridColumnGap ?? gridColumnGapOption
  }

  // Parse gap values
  const parseGap = (val: number | string | undefined): number | undefined => {
    if (val === undefined) return undefined
    return typeof val === "number" ? val : length.parse(val)
  }

  let gridGapX = props.pcbGridColumnGap ?? props.gridColumnGap
  let gridGapY = props.pcbGridRowGap ?? props.gridRowGap

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
    gridGapX = 1
    gridGapY = 1
  }

  // Check if template props are provided
  const hasTemplateColumns = props.pcbGridTemplateColumns !== undefined
  const hasTemplateRows = props.pcbGridTemplateRows !== undefined

  let gridTemplateColumns: string
  let gridTemplateRows: string
  let numCols: number = gridColsOption ?? 0
  let numRows: number = gridRowsOption ?? 0
  let totalGridWidth: number
  let totalGridHeight: number

  if (hasTemplateColumns || hasTemplateRows) {
    // When template props are provided, use them directly without modification
    gridTemplateColumns = props.pcbGridTemplateColumns ?? ""
    gridTemplateRows = props.pcbGridTemplateRows ?? ""
    // For template-based layout, let CssGrid handle the dimensions
    // We'll estimate dimensions for the group size
    if (hasTemplateColumns) {
      const match = gridTemplateColumns.match(/repeat\((\d+),/)
      numCols = match
        ? parseInt(match[1])
        : Math.ceil(Math.sqrt(pcbChildren.length))
    } else {
      numCols = Math.ceil(Math.sqrt(pcbChildren.length))
    }

    if (hasTemplateRows) {
      const match = gridTemplateRows.match(/repeat\((\d+),/)
      numRows = match
        ? parseInt(match[1])
        : Math.ceil(pcbChildren.length / numCols)
    } else {
      numRows = Math.ceil(pcbChildren.length / numCols)
    }

    totalGridWidth = numCols * childWidth + Math.max(0, numCols - 1) * gridGapX
    totalGridHeight =
      numRows * childHeight + Math.max(0, numRows - 1) * gridGapY
  } else {
    // Calculate grid dimensions when only pcbGrid is present
    if (gridColsOption !== undefined && gridRowsOption !== undefined) {
      numCols = gridColsOption
      numRows = gridRowsOption
    } else if (gridColsOption !== undefined) {
      numCols = gridColsOption
      numRows = Math.ceil(pcbChildren.length / numCols)
    } else if (gridRowsOption !== undefined) {
      numRows = gridRowsOption
      numCols = Math.ceil(pcbChildren.length / numRows)
    } else {
      numCols = Math.ceil(Math.sqrt(pcbChildren.length))
      numRows = Math.ceil(pcbChildren.length / numCols)
    }

    if (numCols === 0 && pcbChildren.length > 0) numCols = 1
    if (numRows === 0 && pcbChildren.length > 0) numRows = pcbChildren.length

    totalGridWidth = numCols * childWidth + Math.max(0, numCols - 1) * gridGapX
    totalGridHeight =
      numRows * childHeight + Math.max(0, numRows - 1) * gridGapY

    gridTemplateColumns = `repeat(${numCols}, ${childWidth}px)`
    gridTemplateRows = `repeat(${numRows}, ${childHeight}px)`
  }

  const gridChildren = pcbChildren.map((child, index) => ({
    key: child.getString() || `child-${index}`,
    contentWidth: childWidth,
    contentHeight: childHeight,
  }))

  // console.log({
  //   containerWidth: totalGridWidth,
  //   containerHeight: totalGridHeight,
  //   gridTemplateColumns: gridTemplateColumns,
  //   gridTemplateRows: gridTemplateRows,
  //   gap: [gridGapY, gridGapX], // [rowGap, columnGap]
  //   children: gridChildren,
  // })

  const cssGrid = new CssGrid({
    containerWidth: totalGridWidth,
    containerHeight: totalGridHeight,
    gridTemplateColumns: gridTemplateColumns,
    gridTemplateRows: gridTemplateRows,
    gap: [gridGapY, gridGapX], // [rowGap, columnGap]
    children: gridChildren,
  })

  // Get computed layout from CssGrid
  const { itemCoordinates } = cssGrid.layout()

  // Get group center for positioning
  const groupCenter = group._getGlobalPcbPositionBeforeLayout()

  // Apply positioning to PCB components and groups using CssGrid results
  for (let i = 0; i < pcbChildren.length; i++) {
    const child = pcbChildren[i]
    if (!child.pcb_component_id && !(child as IGroup).pcb_group_id) continue

    const childKey = child.getString() || `child-${i}`
    const coordinates = itemCoordinates[childKey]

    if (!coordinates) {
      console.warn(
        `PCB grid layout: No coordinates found for child ${childKey}`,
      )
      continue
    }

    // Convert CssGrid coordinates to absolute positions
    // CssGrid coordinates are relative to container top-left, we need center-based positioning
    const targetCellCenterX =
      groupCenter.x - totalGridWidth / 2 + coordinates.x + coordinates.width / 2
    const targetCellCenterY =
      groupCenter.y -
      totalGridHeight / 2 +
      coordinates.y +
      coordinates.height / 2

    if (child.pcb_component_id) {
      repositionPcbComponentTo(db.toArray(), child.pcb_component_id, {
        x: targetCellCenterX,
        y: targetCellCenterY,
      })
    } else {
      const groupChild = child as IGroup
      if (groupChild.pcb_group_id) {
        const pcbGroup = db.pcb_group.get(groupChild.pcb_group_id!)
        if (pcbGroup && groupChild.source_group_id) {
          repositionPcbGroupTo(db.toArray(), groupChild.source_group_id, {
            x: targetCellCenterX,
            y: targetCellCenterY,
          })
        }
      }
    }
  }

  // Update group dimensions
  if (group.pcb_group_id) {
    db.pcb_group.update(group.pcb_group_id, {
      width: props.width ?? totalGridWidth,
      height: props.height ?? totalGridHeight,
      center: groupCenter,
    })
  }
}
