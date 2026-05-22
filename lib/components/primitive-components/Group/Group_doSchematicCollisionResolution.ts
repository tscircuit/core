import type { Group } from "./Group"
import { resolveSchematicCollisions } from "lib/utils/schematic/resolveSchematicCollisions"

export function Group_doSchematicCollisionResolution(group: Group): void {
  if (group.root?.schematicDisabled) return

  // Only run at the top-level board — skip nested groups whose parent is another Group
  if (group.parent && "schematic_component_id" in group.parent) return

  const circuitJson = group.root!.db.toArray()
  resolveSchematicCollisions(circuitJson)
}
