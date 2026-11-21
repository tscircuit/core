import type { SourceComponentBase } from "circuit-json"
import { MM_PER_SCHEMATIC_UNIT } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"

/** Restore the cached schematic center as a board-unit placement (right +X, up +Y). */
export const getInflatedSchematicPlacement = (
  source: SourceComponentBase,
  { injectionDb, defaultSchematicLengthUnit, groupsMap }: InflatorContext,
) => {
  const group = source.source_group_id
    ? groupsMap?.get(source.source_group_id)
    : undefined
  const unit = group?._getSchematicLengthUnit() ?? defaultSchematicLengthUnit
  const schematic = injectionDb.schematic_component.getWhere({
    source_component_id: source.source_component_id,
  })
  if (!schematic) return
  if (unit !== "mm" && unit !== "in")
    return { schX: schematic.center.x, schY: schematic.center.y }
  return {
    schX: `${schematic.center.x * MM_PER_SCHEMATIC_UNIT}mm`,
    schY: `${schematic.center.y * MM_PER_SCHEMATIC_UNIT}mm`,
  }
}
