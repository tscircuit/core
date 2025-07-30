import { translate } from "transformation-matrix"
import type { Group } from "./Group"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import {
  transformPCBElements,
  getPrimaryId,
} from "@tscircuit/circuit-json-util"
import { length } from "circuit-json"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"

export function Group_doInitialPcbLayoutGrid(group: Group<any>) {
  const { db } = group.root!
  const props = group._parsedProps

  const pcbChildren = group.children.filter(
    (child) => child.pcb_component_id,
  ) as PrimitiveComponent[]

  if (pcbChildren.length === 0) return

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

  let numCols: number
  let numRows: number

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
    gridGapX = 1
    gridGapY = 1
  }

  const totalGridWidth =
    numCols * maxCellWidth + Math.max(0, numCols - 1) * gridGapX
  const totalGridHeight =
    numRows * maxCellHeight + Math.max(0, numRows - 1) * gridGapY

  const groupCenter = group._getGlobalPcbPositionBeforeLayout()

  const firstCellCenterX = groupCenter.x - totalGridWidth / 2 + maxCellWidth / 2
  const firstCellCenterY =
    groupCenter.y + totalGridHeight / 2 - maxCellHeight / 2

  for (let i = 0; i < pcbChildren.length; i++) {
    const child = pcbChildren[i]
    if (!child.pcb_component_id) continue

    const row = Math.floor(i / numCols)
    const col = i % numCols

    if (row >= numRows || col >= numCols) {
      console.warn(
        `PCB grid layout: Child ${child.getString()} at index ${i} (row ${row}, col ${col}) exceeds grid dimensions (${numRows}x${numCols}). Skipping placement.`,
      )
      continue
    }

    const targetCellCenterX = firstCellCenterX + col * (maxCellWidth + gridGapX)
    const targetCellCenterY =
      firstCellCenterY - row * (maxCellHeight + gridGapY)

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

  if (group.pcb_group_id) {
    db.pcb_group.update(group.pcb_group_id, {
      width: props.width ?? totalGridWidth,
      height: props.height ?? totalGridHeight,
      center: groupCenter,
    })
  }
}
