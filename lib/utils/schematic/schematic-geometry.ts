import {
  convertSchematicLengthUnit,
  type CircuitJsonOps,
  type CircuitJsonUtilObjects,
} from "@tscircuit/circuit-json-util"
import {
  LEGACY_SCHEMATIC_LENGTH_UNIT,
  type AnyCircuitElement,
  type SchematicLengthUnit,
} from "circuit-json"

export type SchematicGeometryRecord = Extract<
  AnyCircuitElement,
  { schematic_length_unit?: SchematicLengthUnit }
>
export type SchematicGeometryInput<K extends SchematicGeometryRecord["type"]> =
  Parameters<CircuitJsonOps<K, AnyCircuitElement>["insert"]>[0] & { type: K }

/** Layout algorithms use drawing units, including when their inputs span multiple subcircuits. */
export function inSchematicDrawingUnits<
  T extends SchematicGeometryRecord | null | undefined,
>(record: T): T {
  if (
    !record?.schematic_length_unit ||
    record.schematic_length_unit === LEGACY_SCHEMATIC_LENGTH_UNIT
  )
    return record
  return convertSchematicLengthUnit(record, LEGACY_SCHEMATIC_LENGTH_UNIT) as T
}

function updateSchematicGeometry<T extends SchematicGeometryRecord>(
  table: {
    get(id: string): T | null
    update(id: string, changes: Partial<T>): T
  },
  id: string,
  changes: Partial<NoInfer<T>>,
) {
  const stored = table.get(id)
  const unit = stored?.schematic_length_unit
  if (!stored || !unit || unit === LEGACY_SCHEMATIC_LENGTH_UNIT)
    return table.update(id, changes)
  const updated = convertSchematicLengthUnit(
    { ...inSchematicDrawingUnits(stored), ...changes },
    unit,
  ) as T
  // Keep untouched coordinates exact across repeated layout updates.
  const patch: Partial<T> = {}
  for (const key of Object.keys(changes) as (keyof T)[])
    patch[key] = updated[key]
  return table.update(id, patch)
}

/** Read and edit a stored table in the drawing units used by schematic layout. */
function drawingTable<T extends SchematicGeometryRecord>(table: {
  get(id: string): T | null
  getWhere(where: Partial<T>): T | null
  list(where?: Partial<T>): T[]
  update(id: string, changes: Partial<T>): T
}) {
  return {
    get: (id: string) => inSchematicDrawingUnits(table.get(id)),
    getWhere: (where: Partial<T>) =>
      inSchematicDrawingUnits(table.getWhere(where)),
    list: (where?: Partial<T>) =>
      table.list(where).map(inSchematicDrawingUnits),
    update: (id: string, changes: Partial<T>) =>
      updateSchematicGeometry(table, id, changes),
  }
}

export function createSchematicLayoutTables(db: CircuitJsonUtilObjects) {
  return {
    arc: drawingTable(db.schematic_arc),
    circle: drawingTable(db.schematic_circle),
    component: drawingTable(db.schematic_component),
    group: drawingTable(db.schematic_group),
    line: drawingTable(db.schematic_line),
    netLabel: drawingTable(db.schematic_net_label),
    path: drawingTable(db.schematic_path),
    port: drawingTable(db.schematic_port),
    rect: drawingTable(db.schematic_rect),
    sheet: drawingTable(db.schematic_sheet),
    text: drawingTable(db.schematic_text),
    trace: drawingTable(db.schematic_trace),
  }
}
