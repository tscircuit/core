import type { SchematicPort } from "circuit-json"
import type { Port } from "../../Port"

/**
 * Resolve a public terminal's internal endpoint from source connectivity.
 * Positions are schematic-world points in mm (+X right, +Y up, right-handed XY),
 * including translation; facingDirection is the outward direction of the frame.
 */
export function getSchematicGroupPortTarget(
  port: Port,
  facingDirection: SchematicPort["facing_direction"],
): SchematicPort | undefined {
  const { db } = port.root!
  const key = port._getSubcircuitConnectivityKey()
  if (!key) return
  const directSourcePortIds = new Set(
    db.source_trace
      .list()
      .filter((trace) =>
        trace.connected_source_port_ids.includes(port.source_port_id!),
      )
      .flatMap((trace) => trace.connected_source_port_ids),
  )
  const candidates = db.schematic_port
    .list()
    .filter(
      (candidate) =>
        candidate.schematic_component_id &&
        db.source_port.get(candidate.source_port_id)
          ?.subcircuit_connectivity_map_key === key,
    )
  // Prefer the explicitly connected pin, then an outward-facing pin. Stable
  // database order breaks ties without changing which electrical net is used.
  return candidates.sort(
    (a, b) =>
      Number(directSourcePortIds.has(b.source_port_id)) -
        Number(directSourcePortIds.has(a.source_port_id)) ||
      Number(b.facing_direction === facingDirection) -
        Number(a.facing_direction === facingDirection),
  )[0]
}
