import { getCircuitJsonTree } from "@tscircuit/circuit-json-util"
import type { z } from "zod"
import type { Group } from "./Group"
import { applySchematicMatchPackLayoutToTree } from "./Group_doInitialSchematicLayoutMatchPack"
import { computeSchematicSectionLayoutUsingRows } from "./placeSchematicLayoutSectionsInRows"
import { updateSchematicPrimitivesForLayoutShift } from "./utils/updateSchematicPrimitivesForLayoutShift"

export type SectionBlock = {
  sectionName: string
  center: { x: number; y: number }
  size: { x: number; y: number }
  sourceCompIds: Set<string>
}

export function Group_doInitialSchematicLayoutSections<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  const sectionNamesUsedByChildren = new Set<string>()
  let hasChildrenWithoutSection = false
  for (const child of group.children) {
    if (!child.source_component_id) continue
    const sectionName = child.getSchematicSectionName()
    if (sectionName !== null) {
      sectionNamesUsedByChildren.add(sectionName)
    } else {
      hasChildrenWithoutSection = true
    }
  }

  const sectionNamesToLayout: string[] = Array.from(sectionNamesUsedByChildren)

  if (sectionNamesToLayout.length === 0 || hasChildrenWithoutSection) return

  // Phase 1: lay out components within each section independently
  for (const sectionName of sectionNamesToLayout) {
    const sectionTree = getCircuitJsonTree(db.toArray(), {
      source_group_id: group.source_group_id!,
    })
    sectionTree.childNodes = sectionTree.childNodes.filter((child) => {
      if (child.nodeType !== "component" || !child.sourceComponent) return false
      const component = group.children.find(
        (c) =>
          c.source_component_id === child.sourceComponent?.source_component_id,
      )
      return component?.getSchematicSectionName() === sectionName
    })
    applySchematicMatchPackLayoutToTree(group, sectionTree)
  }

  const needToPackSections =
    sectionNamesToLayout.length > 1 ||
    (sectionNamesToLayout.length >= 1 && hasChildrenWithoutSection)

  if (!needToPackSections) return

  // Phase 2: compute section bounding boxes from positions set by phase 1
  const sectionNameToInfo = new Map<string, SectionBlock>()

  for (const sectionName of sectionNamesToLayout) {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    const sourceCompIds = new Set<string>()

    for (const child of group.children) {
      const sourceComponentId = child.source_component_id
      if (!sourceComponentId) continue

      const compSectionName = child.getSchematicSectionName()
      if (compSectionName !== sectionName) {
        continue
      }

      const schComp = db.schematic_component.getWhere({
        source_component_id: sourceComponentId,
      })
      if (!schComp) continue

      sourceCompIds.add(sourceComponentId)
      const hw = schComp.size.width / 2
      const hh = schComp.size.height / 2
      minX = Math.min(minX, schComp.center.x - hw)
      maxX = Math.max(maxX, schComp.center.x + hw)
      minY = Math.min(minY, schComp.center.y - hh)
      maxY = Math.max(maxY, schComp.center.y + hh)
    }

    if (!Number.isFinite(minX) || sourceCompIds.size === 0) continue

    sectionNameToInfo.set(sectionName, {
      sectionName,
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      size: { x: maxX - minX, y: maxY - minY },
      sourceCompIds,
    })
  }

  if (sectionNameToInfo.size <= 1) return

  // Phase 3: pack sections into rows
  const groupSchPositionBeforeLayout =
    group._getGlobalSchematicPositionBeforeLayout()
  const sectionPlacements = computeSchematicSectionLayoutUsingRows({
    sectionBlocks: Array.from(sectionNameToInfo.values()).map((info) => ({
      sectionId: info.sectionName,
      size: info.size,
    })),
    groupSchPositionBeforeLayout: groupSchPositionBeforeLayout,
  })

  for (const [sectionId, placement] of sectionPlacements) {
    const sectionInfo = sectionNameToInfo.get(sectionId)
    if (!sectionInfo) continue

    const delta = {
      x: placement.x - sectionInfo.center.x,
      y: placement.y - sectionInfo.center.y,
    }

    for (const sourceComponentId of sectionInfo.sourceCompIds) {
      const schComp = db.schematic_component.getWhere({
        source_component_id: sourceComponentId,
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
