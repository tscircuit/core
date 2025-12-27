import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SimpleRouteJson, Obstacle } from "./SimpleRouteJson"

/**
 * Creates source_traces for interconnect ports that were connected via
 * off-board paths during autorouting. This allows DRC to understand that
 * these ports are intentionally connected.
 *
 * @param db - The circuit database
 * @param connectedOffboardObstacles - Map of obstacleId -> rootConnectionName
 *        from the autorouter's getConnectedOffboardObstacles()
 * @param simpleRouteJson - The SimpleRouteJson used for routing
 * @param subcircuit_id - The subcircuit ID for the traces
 */
export const createSourceTracesFromOffboardConnections = ({
  db,
  connectedOffboardObstacles,
  simpleRouteJson,
  subcircuit_id,
}: {
  db: CircuitJsonUtilObjects
  connectedOffboardObstacles: Record<string, string>
  simpleRouteJson: SimpleRouteJson
  subcircuit_id?: string | null
}): void => {
  if (Object.keys(connectedOffboardObstacles).length === 0) return

  // Build a mapping from pcb element IDs to source_port_id
  const pcbElementIdToSourcePortId = new Map<string, string>()
  for (const pcbPort of db.pcb_port.list()) {
    if (pcbPort.source_port_id) {
      const smtpad = db.pcb_smtpad.getWhere({
        pcb_port_id: pcbPort.pcb_port_id,
      })
      if (smtpad) {
        pcbElementIdToSourcePortId.set(
          smtpad.pcb_smtpad_id,
          pcbPort.source_port_id,
        )
      }
      const platedHole = db.pcb_plated_hole.getWhere({
        pcb_port_id: pcbPort.pcb_port_id,
      })
      if (platedHole) {
        pcbElementIdToSourcePortId.set(
          platedHole.pcb_plated_hole_id,
          pcbPort.source_port_id,
        )
      }
    }
  }

  // Build a map from obstacle ID to obstacle object
  const obstacleById = new Map<string, Obstacle>()
  for (const obstacle of simpleRouteJson.obstacles) {
    if (obstacle.obstacleId) {
      obstacleById.set(obstacle.obstacleId, obstacle)
    }
  }

  // Group obstacles by their root connection name
  const connectionGroups = new Map<string, string[]>()
  for (const [obstacleId, rootConnectionName] of Object.entries(
    connectedOffboardObstacles,
  )) {
    if (!connectionGroups.has(rootConnectionName)) {
      connectionGroups.set(rootConnectionName, [])
    }
    connectionGroups.get(rootConnectionName)!.push(obstacleId)
  }

  // For each group of connected obstacles, find their source_port_ids and
  // create a source_trace if needed
  for (const [rootConnectionName, obstacleIds] of connectionGroups) {
    const sourcePortIds = new Set<string>()

    for (const obstacleId of obstacleIds) {
      const obstacle = obstacleById.get(obstacleId)
      if (!obstacle) continue

      // Find source_port_id from obstacle's connectedTo array
      for (const connectedId of obstacle.connectedTo) {
        const sourcePortId = pcbElementIdToSourcePortId.get(connectedId)
        if (sourcePortId) {
          sourcePortIds.add(sourcePortId)
        }
      }
    }

    // Only create a source_trace if we have multiple ports connected
    if (sourcePortIds.size < 2) continue

    const sourcePortIdArray = Array.from(sourcePortIds)

    // Check if a source_trace already exists connecting these ports
    const existingTraces = db.source_trace.list()
    const alreadyConnected = existingTraces.some((trace) => {
      const tracePortIds = new Set(trace.connected_source_port_ids)
      return sourcePortIdArray.every((id) => tracePortIds.has(id))
    })

    if (alreadyConnected) continue

    // Create the source_trace for this off-board connection
    db.source_trace.insert({
      connected_source_port_ids: sourcePortIdArray,
      connected_source_net_ids: [],
      subcircuit_id: subcircuit_id ?? undefined,
      display_name: `offboard_${rootConnectionName}`,
    })
  }
}
