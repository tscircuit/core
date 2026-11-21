import type { SourceComponentBase } from "circuit-json"
import { SCHEMATIC_UNIT_TO_MM } from "lib/utils/schematic/schematic-unit-to-mm"
import type { InflatorContext } from "../InflatorFn"

/** Restore the cached schematic center as a board-unit placement (right +X, up +Y). */
export const getInflatedSchematicPlacement = (
  source: SourceComponentBase,
  { injectionDb, defaultSchematicLengthUnit }: InflatorContext,
) => {
  if (
    defaultSchematicLengthUnit !== "mm" &&
    defaultSchematicLengthUnit !== "in"
  )
    return
  const schematic = injectionDb.schematic_component.getWhere({
    source_component_id: source.source_component_id,
  })
  if (!schematic) return
  return {
    schX: `${schematic.center.x * SCHEMATIC_UNIT_TO_MM}mm`,
    schY: `${schematic.center.y * SCHEMATIC_UNIT_TO_MM}mm`,
  }
}
