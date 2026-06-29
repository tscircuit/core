import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

/**
 * Resolve the schematic sheet shared by a set of schematic ports, via their
 * schematic components. Traces and net labels belong to the sheet of the
 * components they connect, not to the board they are rendered under.
 *
 * Returns the sheet id when every resolvable port's component is on the same
 * sheet, otherwise `undefined` (no sheet, or a connection that spans sheets) so
 * the caller can fall back to its own resolution.
 */
export function getSchematicSheetIdForPorts(
  schematicPortIds: string[],
  db: CircuitJsonUtilObjects,
): string | undefined {
  const sheetIds = new Set<string>()
  for (const schematicPortId of schematicPortIds) {
    const componentId =
      db.schematic_port.get(schematicPortId)?.schematic_component_id
    if (!componentId) continue
    const sheetId = db.schematic_component.get(componentId)?.schematic_sheet_id
    if (sheetId) sheetIds.add(sheetId)
  }
  return sheetIds.size === 1 ? [...sheetIds][0] : undefined
}
