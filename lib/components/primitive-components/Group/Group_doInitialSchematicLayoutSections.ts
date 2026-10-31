import { getCircuitJsonTree } from "@tscircuit/circuit-json-util"
import type { SchematicSheet as CircuitJsonSchematicSheet } from "circuit-json"
import Debug from "debug"
import {
  SCHEMATIC_SHEET_INNER_MARGIN,
  SCHEMATIC_UNIT_TO_MM,
} from "lib/utils/schematic/warn-if-schematic-elements-outside-sheet"
import type { z } from "zod"
import { SchematicSheet } from "../SchematicSheet"
import type { Group } from "./Group"

const debug = Debug("Group_doInitialSchematicLayoutSections")
import { applySchematicMatchPackLayoutToTree } from "./Group_doInitialSchematicLayoutMatchPack"
import { computeSchematicSectionLayoutUsingRows } from "./computeSchematicSectionLayoutUsingRows"
import { updateSchematicPrimitivesForLayoutShift } from "./utils/updateSchematicPrimitivesForLayoutShift"

type SchematicSheetId = CircuitJsonSchematicSheet["schematic_sheet_id"]

type SectionBoundsWithChildren = {
  sectionName: string | null
  center: { x: number; y: number }
  size: { x: number; y: number }
  sourceCompIds: Set<string>
}

export function Group_doInitialSchematicLayoutSections<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  // Resolve section identity within each sheet: section names can be reused on
  // separate sheets, whose drawings have independently sized world-space frames.
  const sectionNamesBySheet = new Map<
    SchematicSheetId | undefined,
    Set<string | null>
  >()
  for (const child of group.children) {
    if (!child.source_component_id) continue
    const sheetId = child._resolveSchematicSheetId()
    const sectionNames = sectionNamesBySheet.get(sheetId) ?? new Set()
    sectionNames.add(child.getSchematicSectionName())
    sectionNamesBySheet.set(sheetId, sectionNames)
  }

  if (sectionNamesBySheet.size === 0) return

  // Preserve the existing order: named sections precede the virtual section
  // for unsectioned components, regardless of child declaration order.
  for (const sectionNames of sectionNamesBySheet.values()) {
    if (sectionNames.delete(null)) sectionNames.add(null)
  }

  // Phase 1: lay out components within each section independently.
  for (const [sheetId, sectionNames] of sectionNamesBySheet) {
    for (const sectionName of sectionNames) {
      const sectionTree = getCircuitJsonTree(db.toArray(), {
        source_group_id: group.source_group_id!,
      })
      sectionTree.childNodes = sectionTree.childNodes.filter((child) => {
        if (child.nodeType !== "component" || !child.sourceComponent)
          return false
        const component = group.children.find(
          (c) =>
            c.source_component_id ===
            child.sourceComponent?.source_component_id,
        )
        return (
          component?.getSchematicSectionName() === sectionName &&
          component?._resolveSchematicSheetId() === sheetId
        )
      })
      applySchematicMatchPackLayoutToTree(group, sectionTree)
    }
  }

  // Phase 2: compute section bounding boxes from positions set by phase 1.
  const sectionBoundsBySheet = new Map<
    SchematicSheetId | undefined,
    Map<string | null, SectionBoundsWithChildren>
  >()

  for (const [sheetId, sectionNames] of sectionNamesBySheet) {
    const sectionBounds = new Map<string | null, SectionBoundsWithChildren>()
    sectionBoundsBySheet.set(sheetId, sectionBounds)
    for (const sectionName of sectionNames) {
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      const sourceCompIds = new Set<string>()

      for (const child of group.children) {
        const sourceComponentId = child.source_component_id
        if (
          !sourceComponentId ||
          child._resolveSchematicSheetId() !== sheetId ||
          child.getSchematicSectionName() !== sectionName
        )
          continue

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
      sectionBounds.set(sectionName, {
        sectionName,
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        size: { x: maxX - minX, y: maxY - minY },
        sourceCompIds,
      })
    }
  }

  // Phase 3: pack each sheet separately, in schematic world coordinates (+x
  // right, +y up). Sheet dimensions are in mm; reserve the same inner frame
  // margin as the out-of-sheet warning before converting to schematic units.
  const groupSchPositionBeforeLayout =
    group._getGlobalSchematicPositionBeforeLayout()
  for (const [sheetId, sectionBounds] of sectionBoundsBySheet) {
    if (sectionBounds.size <= 1) continue
    const anchoredSections = new Set<string | null>()
    for (const child of group.children) {
      if (
        !child.source_component_id ||
        child._resolveSchematicSheetId() !== sheetId
      )
        continue
      const props = (child as any)._parsedProps
      if (props?.schX !== undefined || props?.schY !== undefined) {
        anchoredSections.add(child.getSchematicSectionName())
      }
    }

    const sheet = sheetId ? db.schematic_sheet.get(sheetId) : undefined
    const sheetWidth = sheet?.sheet_width
    const sheetComponent = sheetId
      ? group
          .root!.children.flatMap((child) => [child, ...child.getDescendants()])
          .find(
            (child): child is SchematicSheet =>
              child instanceof SchematicSheet &&
              child.schematic_sheet_id === sheetId,
          )
      : undefined
    // Explicit sheet dimensions are centered at world x=0 by SchematicSheet;
    // auto-sized sheets are instead centered around their contents later.
    const hasFixedSheetCenter =
      sheetComponent?._parsedProps.sheetWidth !== undefined ||
      sheetComponent?._parsedProps.sheetHeight !== undefined
    const centerOffset = hasFixedSheetCenter
      ? Math.abs(groupSchPositionBeforeLayout.x)
      : 0
    const maxRowWidth =
      sheetWidth === undefined
        ? undefined
        : Math.max(
            0,
            sheetWidth / SCHEMATIC_UNIT_TO_MM -
              2 * (SCHEMATIC_SHEET_INNER_MARGIN + centerOffset),
          )
    const sectionPlacements = computeSchematicSectionLayoutUsingRows({
      sectionBlocks: Array.from(sectionBounds.values()).map((bounds) => ({
        sectionName: bounds.sectionName,
        size: bounds.size,
      })),
      groupSchPositionBeforeLayout,
      maxRowWidth,
    })

    for (const [sectionName, placement] of sectionPlacements) {
      const boundsWithChildren = sectionBounds.get(sectionName)
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
}
