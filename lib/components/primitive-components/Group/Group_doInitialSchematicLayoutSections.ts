import type { z } from "zod"
import type { Group } from "./Group"
import { Group_doInitialSchematicLayoutMatchPack } from "./Group_doInitialSchematicLayoutMatchPack"
import { updateSchematicPrimitivesForLayoutShift } from "./utils/updateSchematicPrimitivesForLayoutShift"

export function Group_doInitialSchematicLayoutSections<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  const usedSectionNames = new Set<string>()
  let hasUnsectioned = false
  for (const child of group.children) {
    if (!child.source_component_id) continue
    const sectionName = child._parsedProps?.schSectionName ?? null
    if (sectionName !== null) {
      usedSectionNames.add(sectionName)
    } else {
      hasUnsectioned = true
    }
  }

  const sectionsToLayout: (string | null)[] = Array.from(usedSectionNames)
  if (hasUnsectioned) sectionsToLayout.push(null)

  if (sectionsToLayout.length === 0) return

  // Phase 1: lay out components within each section independently
  for (const sectionFilter of sectionsToLayout) {
    Group_doInitialSchematicLayoutMatchPack(group, { sectionFilter })
  }

  if (sectionsToLayout.length <= 1) return

  // Phase 2: compute section bounding boxes from positions set by phase 1

  type SectionInfo = {
    sectionId: string
    center: { x: number; y: number }
    size: { x: number; y: number }
    sourceCompIds: Set<string>
  }

  const sectionInfoMap = new Map<string, SectionInfo>()

  for (const sectionFilter of sectionsToLayout) {
    const sectionId = sectionFilter ?? "__unsectioned__"
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    const sourceCompIds = new Set<string>()

    for (const child of group.children) {
      const srcId = child.source_component_id
      if (!srcId) continue
      const compSection = child._parsedProps?.schSectionName ?? null
      if (sectionFilter === null) {
        if (compSection !== null) continue
      } else if (compSection !== sectionFilter) {
        continue
      }

      const schComp = db.schematic_component.getWhere({
        source_component_id: srcId,
      })
      if (!schComp) continue

      sourceCompIds.add(srcId)
      const hw = schComp.size.width / 2
      const hh = schComp.size.height / 2
      minX = Math.min(minX, schComp.center.x - hw)
      maxX = Math.max(maxX, schComp.center.x + hw)
      minY = Math.min(minY, schComp.center.y - hh)
      maxY = Math.max(maxY, schComp.center.y + hh)
    }

    if (!isFinite(minX) || sourceCompIds.size === 0) continue

    sectionInfoMap.set(sectionId, {
      sectionId,
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      size: { x: maxX - minX, y: maxY - minY },
      sourceCompIds,
    })
  }

  if (sectionInfoMap.size <= 1) return

  // Phase 3: pack sections into rows
  const SECTION_GAP = 1.0 // schematic units between sections
  const MARGIN = 1.5 // padding around each section's bounding box
  const sections = Array.from(sectionInfoMap.values())

  // target width = sqrt(total area) * 2 for a wide aspect ratio
  const totalArea = sections.reduce((sum, s) => {
    const w = Math.max(s.size.x, 0.5) + MARGIN * 2
    const h = Math.max(s.size.y, 0.5) + MARGIN * 2
    return sum + w * h
  }, 0)
  const targetRowWidth = Math.sqrt(totalArea) * 2

  type RowEntry = { sectionId: string; x: number; width: number; height: number }
  const rows: RowEntry[][] = []
  let currentRow: RowEntry[] = []
  let currentRowWidth = 0

  for (const info of sections) {
    const w = Math.max(info.size.x, 0.5) + MARGIN * 2
    const h = Math.max(info.size.y, 0.5) + MARGIN * 2
    let neededWidth = w
    if (currentRowWidth > 0) neededWidth = currentRowWidth + SECTION_GAP + w

    if (currentRow.length > 0 && neededWidth > targetRowWidth) {
      rows.push(currentRow)
      currentRow = []
      currentRowWidth = 0
    }

    let x = 0
    if (currentRowWidth > 0) x = currentRowWidth + SECTION_GAP
    currentRow.push({ sectionId: info.sectionId, x, width: w, height: h })
    currentRowWidth = x + w
  }
  if (currentRow.length > 0) rows.push(currentRow)

  const sectionPlacements = new Map<string, { x: number; y: number }>()
  const groupOffset = group._getGlobalSchematicPositionBeforeLayout()
  let rowY = 0

  for (const row of rows) {
    const rowHeight = Math.max(...row.map((e) => e.height))
    const rowTotalWidth =
      row[row.length - 1]!.x + row[row.length - 1]!.width
    const rowOffsetX = -rowTotalWidth / 2

    for (const entry of row) {
      sectionPlacements.set(entry.sectionId, {
        x: rowOffsetX + entry.x + entry.width / 2 + groupOffset.x,
        y: rowY - rowHeight / 2 + groupOffset.y,
      })
    }
    rowY -= rowHeight + SECTION_GAP
  }

  for (const [sectionId, placement] of sectionPlacements) {
    const info = sectionInfoMap.get(sectionId)
    if (!info) continue

    const delta = {
      x: placement.x - info.center.x,
      y: placement.y - info.center.y,
    }

    for (const srcId of info.sourceCompIds) {
      const schComp = db.schematic_component.getWhere({
        source_component_id: srcId,
      })
      if (!schComp) continue

      const ports = db.schematic_port.list({
        schematic_component_id: schComp.schematic_component_id,
      })
      const texts = db.schematic_text.list({
        schematic_component_id: schComp.schematic_component_id,
      })

      for (const port of ports) {
        port.center.x += delta.x
        port.center.y += delta.y
      }
      for (const text of texts) {
        text.position.x += delta.x
        text.position.y += delta.y
      }

      updateSchematicPrimitivesForLayoutShift({
        db,
        schematicComponentId: schComp.schematic_component_id,
        deltaX: delta.x,
        deltaY: delta.y,
      })

      schComp.center = {
        x: schComp.center.x + delta.x,
        y: schComp.center.y + delta.y,
      }
    }
  }
}
