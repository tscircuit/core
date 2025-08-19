import type { Group } from "./Group"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { IGroup } from "./IGroup"
import {
  repositionPcbComponentTo,
  repositionPcbGroupTo,
} from "@tscircuit/circuit-json-util"
import { length } from "circuit-json"
import { CssGrid } from "minicssgrid"

interface GridConfig {
  cols?: number
  rows?: number
  gapX: number
  gapY: number
  templateColumns?: string
  templateRows?: string
}

interface ChildDimensions {
  width: number
  height: number
}

interface GridLayout {
  gridTemplateColumns: string
  gridTemplateRows: string
  containerWidth: number
  containerHeight: number
}

export function Group_doInitialPcbLayoutGrid(group: Group<any>) {
  const { db } = group.root!
  const props = group._parsedProps

  const pcbChildren = getPcbChildren(group)
  if (pcbChildren.length === 0) return

  const childDimensions = calculateChildDimensions(db, pcbChildren)
  const gridConfig = parseGridConfiguration(props)
  const gridLayout = createGridLayout(
    props,
    pcbChildren,
    childDimensions,
    gridConfig,
  )

  const cssGrid = createCssGrid(
    pcbChildren,
    childDimensions,
    gridLayout,
    gridConfig,
  )
  const { itemCoordinates } = cssGrid.layout()

  positionChildren(db, group, pcbChildren, itemCoordinates, gridLayout)
  updateGroupDimensions(db, group, props, gridLayout)
}

function getPcbChildren(group: Group<any>): (PrimitiveComponent | IGroup)[] {
  return group.children.filter(
    (child) => child.pcb_component_id || (child as IGroup).pcb_group_id,
  ) as (PrimitiveComponent | IGroup)[]
}

function calculateChildDimensions(
  db: any,
  pcbChildren: (PrimitiveComponent | IGroup)[],
): ChildDimensions {
  let maxWidth = 0
  let maxHeight = 0

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

    maxWidth = Math.max(maxWidth, width)
    maxHeight = Math.max(maxHeight, height)
  }

  return {
    width: maxWidth || 1,
    height: maxHeight || 1,
  }
}

function parseGridConfiguration(props: any): GridConfig {
  // Extract basic grid options from various prop sources
  const cols =
    props.pcbGridCols ?? props.gridCols ?? props.pcbLayout?.grid?.cols
  const rows = props.pcbGridRows ?? props.pcbLayout?.grid?.rows
  const templateColumns = props.pcbGridTemplateColumns
  const templateRows = props.pcbGridTemplateRows

  // Parse gap values with fallback logic
  const parseGap = (val: number | string | undefined): number => {
    if (val === undefined) return 1
    return typeof val === "number" ? val : length.parse(val)
  }

  const gridGapOption =
    props.pcbGridGap ?? props.gridGap ?? props.pcbLayout?.gridGap
  const rowGapOption =
    props.pcbGridRowGap ?? props.gridRowGap ?? props.pcbLayout?.gridRowGap
  const colGapOption =
    props.pcbGridColumnGap ??
    props.gridColumnGap ??
    props.pcbLayout?.gridColumnGap

  let gapX = 1
  let gapY = 1

  if (rowGapOption !== undefined || colGapOption !== undefined) {
    const fallbackX =
      typeof gridGapOption === "object" ? gridGapOption?.x : gridGapOption
    const fallbackY =
      typeof gridGapOption === "object" ? gridGapOption?.y : gridGapOption
    gapX = parseGap(colGapOption ?? fallbackX)
    gapY = parseGap(rowGapOption ?? fallbackY)
  } else if (typeof gridGapOption === "object" && gridGapOption !== null) {
    gapX = parseGap(gridGapOption.x)
    gapY = parseGap(gridGapOption.y)
  } else {
    const gap = parseGap(gridGapOption)
    gapX = gap
    gapY = gap
  }

  return { cols, rows, gapX, gapY, templateColumns, templateRows }
}

function createGridLayout(
  props: any,
  pcbChildren: any[],
  childDimensions: ChildDimensions,
  gridConfig: GridConfig,
): GridLayout {
  if (props.pcbGridTemplateColumns || props.pcbGridTemplateRows) {
    return createTemplateBasedLayout(
      props,
      gridConfig,
      pcbChildren,
      childDimensions,
    )
  }

  return createDefaultLayout(gridConfig, pcbChildren, childDimensions)
}

function createTemplateBasedLayout(
  props: any,
  gridConfig: GridConfig,
  pcbChildren: any[],
  childDimensions: ChildDimensions,
): GridLayout {
  const gridTemplateColumns = props.pcbGridTemplateColumns ?? ""
  const gridTemplateRows = props.pcbGridTemplateRows ?? ""

  // Extract dimensions for container sizing (best effort)
  const extractRepeatCount = (template: string) => {
    const match = template.match(/repeat\((\d+),/)
    return match ? parseInt(match[1]) : Math.ceil(Math.sqrt(pcbChildren.length))
  }

  const numCols = props.pcbGridTemplateColumns
    ? extractRepeatCount(gridTemplateColumns)
    : Math.ceil(Math.sqrt(pcbChildren.length))
  const numRows = props.pcbGridTemplateRows
    ? extractRepeatCount(gridTemplateRows)
    : Math.ceil(pcbChildren.length / numCols)

  const containerWidth =
    numCols * childDimensions.width + Math.max(0, numCols - 1) * gridConfig.gapX
  const containerHeight =
    numRows * childDimensions.height +
    Math.max(0, numRows - 1) * gridConfig.gapY

  return {
    gridTemplateColumns,
    gridTemplateRows,
    containerWidth,
    containerHeight,
  }
}

function createDefaultLayout(
  gridConfig: GridConfig,
  pcbChildren: any[],
  childDimensions: ChildDimensions,
): GridLayout {
  let numCols: number
  let numRows: number

  // Determine grid dimensions based on available props
  if (gridConfig.cols !== undefined && gridConfig.rows !== undefined) {
    numCols = gridConfig.cols
    numRows = gridConfig.rows
  } else if (gridConfig.cols !== undefined) {
    numCols = gridConfig.cols
    numRows = Math.ceil(pcbChildren.length / numCols)
  } else if (gridConfig.rows !== undefined) {
    numRows = gridConfig.rows
    numCols = Math.ceil(pcbChildren.length / numRows)
  } else {
    numCols = Math.ceil(Math.sqrt(pcbChildren.length))
    numRows = Math.ceil(pcbChildren.length / numCols)
  }

  // Ensure minimum dimensions
  numCols = Math.max(1, numCols)
  numRows = Math.max(1, numRows)

  const containerWidth =
    numCols * childDimensions.width + Math.max(0, numCols - 1) * gridConfig.gapX
  const containerHeight =
    numRows * childDimensions.height +
    Math.max(0, numRows - 1) * gridConfig.gapY

  const gridTemplateColumns = `repeat(${numCols}, ${childDimensions.width}px)`
  const gridTemplateRows = `repeat(${numRows}, ${childDimensions.height}px)`

  return {
    gridTemplateColumns,
    gridTemplateRows,
    containerWidth,
    containerHeight,
  }
}

function createCssGrid(
  pcbChildren: any[],
  childDimensions: ChildDimensions,
  gridLayout: GridLayout,
  gridConfig: GridConfig,
): CssGrid {
  const gridChildren = pcbChildren.map((child, index) => ({
    key: child.getString() || `child-${index}`,
    contentWidth: childDimensions.width,
    contentHeight: childDimensions.height,
  }))

  return new CssGrid({
    containerWidth: gridLayout.containerWidth,
    containerHeight: gridLayout.containerHeight,
    gridTemplateColumns: gridLayout.gridTemplateColumns,
    gridTemplateRows: gridLayout.gridTemplateRows,
    gap: [gridConfig.gapY, gridConfig.gapX], // [rowGap, columnGap]
    children: gridChildren,
  })
}

function positionChildren(
  db: any,
  group: Group<any>,
  pcbChildren: (PrimitiveComponent | IGroup)[],
  itemCoordinates: any,
  gridLayout: GridLayout,
) {
  const groupCenter = group._getGlobalPcbPositionBeforeLayout()
  const allCircuitJson = db.toArray()

  for (let i = 0; i < pcbChildren.length; i++) {
    const child = pcbChildren[i]
    const childKey = child.getString() || `child-${i}`
    const coordinates = itemCoordinates[childKey]

    if (!coordinates) {
      console.warn(
        `PCB grid layout: No coordinates found for child ${childKey}`,
      )
      continue
    }

    // Calculate target position (center-based)
    const targetX =
      groupCenter.x -
      gridLayout.containerWidth / 2 +
      coordinates.x +
      coordinates.width / 2
    const targetY =
      groupCenter.y -
      gridLayout.containerHeight / 2 +
      coordinates.y +
      coordinates.height / 2

    if (child.pcb_component_id) {
      repositionPcbComponentTo(allCircuitJson, child.pcb_component_id, {
        x: targetX,
        y: targetY,
      })
    } else {
      const groupChild = child as IGroup
      if (groupChild.pcb_group_id && groupChild.source_group_id) {
        repositionPcbGroupTo(allCircuitJson, groupChild.source_group_id, {
          x: targetX,
          y: targetY,
        })
      }
    }
  }
}

function updateGroupDimensions(
  db: any,
  group: Group<any>,
  props: any,
  gridLayout: GridLayout,
) {
  if (group.pcb_group_id) {
    const groupCenter = group._getGlobalPcbPositionBeforeLayout()
    db.pcb_group.update(group.pcb_group_id, {
      width: props.width ?? gridLayout.containerWidth,
      height: props.height ?? gridLayout.containerHeight,
      center: groupCenter,
    })
  }
}
