import { translate } from "transformation-matrix"
import type { Group } from "./Group"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import {
  transformPCBElements,
  getPrimaryId,
} from "@tscircuit/circuit-json-util"
import { length } from "circuit-json"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"
import { CssGrid } from "minicssgrid"

export function Group_doInitialPcbLayoutGrid(group: Group<any>) {
  const { db } = group.root!
  const props = group._parsedProps

  const pcbChildren = group.children.filter(
    (child) => child.pcb_component_id,
  ) as PrimitiveComponent[]

  if (pcbChildren.length === 0) return

  // Calculate individual component dimensions
  let maxCellWidth = 0
  let maxCellHeight = 0

  for (const child of pcbChildren) {
    const pcbComp = db.pcb_component.get(child.pcb_component_id!)
    let width = pcbComp?.width ?? 0
    let height = pcbComp?.height ?? 0
    if (width === 0 || height === 0) {
      const bounds = getBoundsOfPcbComponents(child.children)
      width = Math.max(width, bounds.width)
      height = Math.max(height, bounds.height)
    }
    maxCellWidth = Math.max(maxCellWidth, width)
    maxCellHeight = Math.max(maxCellHeight, height)
  }

  if (maxCellWidth === 0 && pcbChildren.length > 0) maxCellWidth = 1
  if (maxCellHeight === 0 && pcbChildren.length > 0) maxCellHeight = 1

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

  // Determine grid dimensions
  let numCols: number = gridColsOption ?? 0
  let numRows: number = gridRowsOption ?? 0

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

  // Calculate total grid dimensions
  const totalGridWidth =
    numCols * maxCellWidth + Math.max(0, numCols - 1) * gridGapX
  const totalGridHeight =
    numRows * maxCellHeight + Math.max(0, numRows - 1) * gridGapY

  // Create CssGrid configuration
  const gridTemplate = `repeat(${numCols}, ${maxCellWidth}px)`
  const gridRowTemplate = `repeat(${numRows}, ${maxCellHeight}px)`

  const gridChildren = pcbChildren.map((child, index) => ({
    key: child.getString() || `child-${index}`,
    contentWidth: maxCellWidth,
    contentHeight: maxCellHeight,
  }))

  const cssGrid = new CssGrid({
    containerWidth: totalGridWidth,
    containerHeight: totalGridHeight,
    gridTemplateColumns: gridTemplate,
    gridTemplateRows: gridRowTemplate,
    gap: [gridGapY, gridGapX], // [rowGap, columnGap]
    children: gridChildren,
  })

  // Get computed layout from CssGrid
  const { itemCoordinates } = cssGrid.layout()

  // Get group center for positioning
  const groupCenter = group._getGlobalPcbPositionBeforeLayout()

  // Apply positioning to PCB components using CssGrid results
  for (let i = 0; i < pcbChildren.length; i++) {
    const child = pcbChildren[i]
    if (!child.pcb_component_id) continue

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
      groupCenter.y +
      totalGridHeight / 2 -
      coordinates.y -
      coordinates.height / 2

    const pcbComp = db.pcb_component.get(child.pcb_component_id!)
    if (pcbComp) {
      const oldCenter = pcbComp.center
      const newCenter = { x: targetCellCenterX, y: targetCellCenterY }

      const deltaX = newCenter.x - oldCenter.x
      const deltaY = newCenter.y - oldCenter.y

      const mat = translate(deltaX, deltaY)
      const related = db
        .toArray()
        .filter((e) => (e as any).pcb_component_id === child.pcb_component_id)
      const moved = transformPCBElements(related as any, mat)
      for (const elm of moved) {
        const idProp = getPrimaryId(elm as any)
        // @ts-ignore dynamic index access
        db[elm.type].update((elm as any)[idProp], elm as any)
      }

      db.pcb_component.update(child.pcb_component_id, {
        center: newCenter,
      })

      child.setProps({
        ...child.props,
        pcbX: (child.props.pcbX ?? 0) + deltaX,
        pcbY: (child.props.pcbY ?? 0) + deltaY,
      })
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
