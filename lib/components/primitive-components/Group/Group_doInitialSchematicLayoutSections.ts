import type { CircuitJsonTreeNode } from "@tscircuit/circuit-json-util"
import type { SchematicSheet } from "circuit-json"
import Debug from "debug"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { z } from "zod"
import type { Group } from "./Group"

import { getSchematicSheetContentWidth } from "lib/utils/schematic/warn-if-schematic-elements-outside-sheet"
import { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"
import { computeSchematicSectionLayoutUsingRows } from "./computeSchematicSectionLayoutUsingRows"
import { updateSchematicPrimitivesForLayoutShift } from "./utils/updateSchematicPrimitivesForLayoutShift"

const debug = Debug("Group_doInitialSchematicLayoutSections")

type SectionBoundsWithChildren = {
  sectionName: string | null
  center: { x: number; y: number }
  size: { x: number; y: number }
  sourceCompIds: Set<string>
}

export function Group_doInitialSchematicLayoutSections<
  Props extends z.ZodType<any, any, any>,
>(
  group: Group<Props>,
  tree: CircuitJsonTreeNode,
  layoutChildren: PrimitiveComponent[],
  schematicSheetId?: SchematicSheet["schematic_sheet_id"],
): void {
  const { db } = group.root!

  // Fully positioned sections already have their final symbol and section bounds.
  if (
    layoutChildren.every(
      (child) =>
        !child.source_component_id ||
        child._parsedProps.schX !== undefined ||
        child._parsedProps.schY !== undefined,
    )
  ) {
    return
  }

  const sectionNamesUsedByChildren = new Set<string>()
  let hasChildrenWithoutSection = false
  for (const child of layoutChildren) {
    if (!child.source_component_id) continue
    const sectionName = child.getSchematicSectionName()
    if (sectionName !== null) {
      sectionNamesUsedByChildren.add(sectionName)
    } else {
      hasChildrenWithoutSection = true
    }
  }

  const sectionNamesToLayout: (string | null)[] = Array.from(
    sectionNamesUsedByChildren,
  )
  if (hasChildrenWithoutSection) sectionNamesToLayout.push(null)

  if (sectionNamesToLayout.length === 0) return

  // Phase 1: lay out components within each section independently
  for (const sectionName of sectionNamesToLayout) {
    const childNodes = tree.childNodes.filter((child) => {
      if (child.nodeType !== "component" || !child.sourceComponent) return false
      const component = layoutChildren.find(
        (c) =>
          c.source_component_id === child.sourceComponent?.source_component_id,
      )
      const compSection = component?.getSchematicSectionName() ?? null
      return compSection === sectionName
    })
    applySchematicMatchPackLayoutToTree(
      group,
      { ...tree, childNodes },
      { schematicSheetId, layoutChildren },
    )
  }

  if (sectionNamesToLayout.length <= 1) return

  // Phase 2: compute section bounding boxes from positions set by phase 1
  const sectionNameToBoundsWithChildren = new Map<
    string | null,
    SectionBoundsWithChildren
  >()

  for (const sectionName of sectionNamesToLayout) {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    const sourceCompIds = new Set<string>()

    for (const child of layoutChildren) {
      const sourceComponentId = child.source_component_id
      if (!sourceComponentId) continue

      const compSectionName = child.getSchematicSectionName()
      if (compSectionName !== sectionName) continue

      const schComp = db.schematic_component.getWhere({
        source_component_id: sourceComponentId,
        ...(schematicSheetId && { schematic_sheet_id: schematicSheetId }),
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

    sectionNameToBoundsWithChildren.set(sectionName, {
      sectionName,
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      size: { x: maxX - minX, y: maxY - minY },
      sourceCompIds,
    })
  }

  if (sectionNameToBoundsWithChildren.size <= 1) return

  // Sections containing a manually positioned component are anchored — their
  // position is already set by phase 1 and must not be overridden by row packing.
  const anchoredSections = new Set<string | null>()
  for (const child of layoutChildren) {
    if (!child.source_component_id) continue
    const props = (child as any)._parsedProps
    if (props?.schX !== undefined || props?.schY !== undefined) {
      anchoredSections.add(child.getSchematicSectionName())
    }
  }

  // Phase 3: pack sections into rows
  const groupSchPositionBeforeLayout =
    group._getGlobalSchematicPositionBeforeLayout()
  const schematicSheet = schematicSheetId
    ? db.schematic_sheet.get(schematicSheetId)
    : undefined
  const maxRowWidth =
    schematicSheet?.sheet_width !== undefined
      ? getSchematicSheetContentWidth(schematicSheet.sheet_width)
      : undefined
  const sectionPlacements = computeSchematicSectionLayoutUsingRows({
    sectionBlocks: Array.from(sectionNameToBoundsWithChildren.values()).map(
      (bounds) => ({
        sectionName: bounds.sectionName,
        size: bounds.size,
      }),
    ),
    groupSchPositionBeforeLayout,
    maxRowWidth,
  })

  for (const [sectionName, placement] of sectionPlacements) {
    const boundsWithChildren = sectionNameToBoundsWithChildren.get(sectionName)
    if (!boundsWithChildren) continue

    if (anchoredSections.has(sectionName)) {
      debug(
        `[${group.name}] Section "${sectionName}" anchored by manual position, skipping shift`,
      )
      continue
    }

    const delta = {
      x: placement.x - boundsWithChildren.center.x,
      y: placement.y - boundsWithChildren.center.y,
    }

    for (const sourceComponentId of boundsWithChildren.sourceCompIds) {
      const schComp = db.schematic_component.getWhere({
        source_component_id: sourceComponentId,
        ...(schematicSheetId && { schematic_sheet_id: schematicSheetId }),
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
