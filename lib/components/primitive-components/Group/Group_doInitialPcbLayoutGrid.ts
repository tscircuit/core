import { translate } from "transformation-matrix"
import type { Group } from "./Group"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import {
  transformPCBElements,
  getPrimaryId,
} from "@tscircuit/circuit-json-util"

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
    if (pcbComp) {
      maxCellWidth = Math.max(maxCellWidth, pcbComp.width)
      maxCellHeight = Math.max(maxCellHeight, pcbComp.height)
    }
  }

  if (maxCellWidth === 0 && pcbChildren.length > 0) maxCellWidth = 1
  if (maxCellHeight === 0 && pcbChildren.length > 0) maxCellHeight = 1

  let gridColsOption = props.gridCols
  let gridRowsOption: number | undefined = undefined
  let gridGapOption = props.gridGap

  if (props.pcbLayout?.grid) {
    gridColsOption = props.pcbLayout.grid.cols ?? gridColsOption
    gridRowsOption = props.pcbLayout.grid.rows
    gridGapOption = props.pcbLayout.grid.gap ?? gridGapOption
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
  if (typeof gridGapOption === "number") {
    gridGapX = gridGapOption
    gridGapY = gridGapOption
  } else if (typeof gridGapOption === "object" && gridGapOption !== null) {
    gridGapX = gridGapOption.x
    gridGapY = gridGapOption.y
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
      width: totalGridWidth,
      height: totalGridHeight,
      center: groupCenter,
    })
  }
}
