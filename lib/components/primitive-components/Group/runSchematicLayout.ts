import {
  cjuIndexed,
  convertSchematicLengthUnit,
  convertSchematicLengthUnits,
  type CircuitJsonUtilObjects,
} from "@tscircuit/circuit-json-util"
import { LEGACY_SCHEMATIC_LENGTH_UNIT } from "circuit-json"
import type { Group } from "./Group"

export interface SchematicLayoutContext {
  group: Group<any>
  db: CircuitJsonUtilObjects
}

/** Group layout solvers edit geometry in place in their right-handed drawing frame (+X right, +Y up). */
export function runSchematicLayout(
  group: Group<any>,
  layout: (ctx: SchematicLayoutContext) => void,
) {
  const { db } = group.root!
  const stored = db.toArray()
  const drawing = convertSchematicLengthUnits(
    stored,
    LEGACY_SCHEMATIC_LENGTH_UNIT,
  )
  if (drawing === stored) return layout({ group, db })
  layout({
    group,
    db: cjuIndexed(drawing, { indexConfig: { byId: true, byType: true } }),
  })

  // Drawing-unit records already share their database objects. Apply only the
  // fields a solver moved on the physical-unit copies, preserving all other values exactly.
  for (const [index, record] of stored.entries()) {
    const result = drawing[index]!
    if (
      result === record ||
      !("schematic_length_unit" in record) ||
      !record.schematic_length_unit
    )
      continue
    const before = convertSchematicLengthUnit(
      record,
      LEGACY_SCHEMATIC_LENGTH_UNIT,
    )
    const changedKeys = Object.keys(result).filter((key) => {
      const previous = Reflect.get(before, key)
      const next = Reflect.get(result, key)
      return (
        previous !== next &&
        (typeof next !== "object" ||
          JSON.stringify(previous) !== JSON.stringify(next))
      )
    })
    if (changedKeys.length === 0) continue
    const converted = convertSchematicLengthUnit(
      result,
      record.schematic_length_unit,
    )
    const changes = Object.fromEntries(
      changedKeys.map((key) => [key, Reflect.get(converted, key)]),
    )
    db[record.type].update(Reflect.get(record, `${record.type}_id`), changes)
  }
}
