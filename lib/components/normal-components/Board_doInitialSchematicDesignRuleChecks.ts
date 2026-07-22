import { getBoundFromCenteredRect, type Bounds } from "@tscircuit/math-utils"
import type { SchematicComponent } from "circuit-json"
import type { Board } from "./Board"

const OVERLAP_EPSILON = 1e-9

const getSchematicComponentBounds = (
  schematicComponent: SchematicComponent,
): Bounds | null => {
  const { center, size } = schematicComponent
  if (
    !Number.isFinite(center.x) ||
    !Number.isFinite(center.y) ||
    !Number.isFinite(size.width) ||
    !Number.isFinite(size.height) ||
    size.width <= 0 ||
    size.height <= 0
  ) {
    return null
  }

  return getBoundFromCenteredRect({
    center,
    width: size.width,
    height: size.height,
  })
}

const boundsHavePositiveAreaOverlap = (a: Bounds, b: Bounds) =>
  Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > OVERLAP_EPSILON &&
  Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY) > OVERLAP_EPSILON

export const Board_doInitialSchematicDesignRuleChecks = (board: Board) => {
  if (board.root?.schematicDisabled) return

  const drcChecksDisabled =
    board.root?.platform?.drcChecksDisabled ??
    board.getInheritedProperty("drcChecksDisabled")
  if (drcChecksDisabled) return

  const { db } = board.root!
  const schematicComponents = db
    .subtree({ subcircuit_id: board.subcircuit_id })
    .schematic_component.list()
    .filter((schematicComponent) => !schematicComponent.is_schematic_group)
  const boundsBySchematicComponentId = new Map(
    schematicComponents.map((schematicComponent) => [
      schematicComponent.schematic_component_id,
      getSchematicComponentBounds(schematicComponent),
    ]),
  )

  for (let i = 0; i < schematicComponents.length; i++) {
    const firstSchematicComponent = schematicComponents[i]
    const firstBounds = boundsBySchematicComponentId.get(
      firstSchematicComponent.schematic_component_id,
    )
    if (!firstBounds) continue

    for (let j = i + 1; j < schematicComponents.length; j++) {
      const secondSchematicComponent = schematicComponents[j]
      if (
        firstSchematicComponent.schematic_sheet_id !==
        secondSchematicComponent.schematic_sheet_id
      ) {
        continue
      }

      const secondBounds = boundsBySchematicComponentId.get(
        secondSchematicComponent.schematic_component_id,
      )
      if (
        !secondBounds ||
        !boundsHavePositiveAreaOverlap(firstBounds, secondBounds)
      ) {
        continue
      }

      const firstSourceComponent = firstSchematicComponent.source_component_id
        ? db.source_component.get(firstSchematicComponent.source_component_id)
        : null
      const secondSourceComponent = secondSchematicComponent.source_component_id
        ? db.source_component.get(secondSchematicComponent.source_component_id)
        : null
      const firstName =
        firstSourceComponent?.display_name ??
        firstSourceComponent?.name ??
        firstSchematicComponent.schematic_component_id
      const secondName =
        secondSourceComponent?.display_name ??
        secondSourceComponent?.name ??
        secondSchematicComponent.schematic_component_id

      const warning = db.schematic_component_overlap_warning.insert({
        warning_type: "schematic_component_overlap_warning",
        message: `Schematic components ${firstName} and ${secondName} overlap`,
        schematic_component_ids: [
          firstSchematicComponent.schematic_component_id,
          secondSchematicComponent.schematic_component_id,
        ],
        schematic_sheet_id: firstSchematicComponent.schematic_sheet_id,
      })
      board._schematicComponentOverlapWarningIds.push(
        warning.schematic_component_overlap_warning_id,
      )
    }
  }
}
