import type {
  ImplicitBreakoutBounds,
  ImplicitBreakoutBus,
} from "@tscircuit/props"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getUnbrokenCopperPourObstacles } from "lib/utils/autorouting/getUnbrokenCopperPourObstacles"
import type { Obstacle } from "lib/utils/obstacles/types"
import type { z } from "zod"
import type { Group } from "../Group/Group"

/**
 * Prove that fixed copper covers a whole breakout region. Bounds and obstacle
 * centers are board-world points in mm, with +X right and +Y up. Each included
 * rectangle spans the region's full width; their Y intervals must also cover
 * its full height. Partial coverage leaves the layer available.
 */
const unbrokenPoursCoverBreakout = (
  bounds: ImplicitBreakoutBounds,
  obstacles: readonly Obstacle[],
): boolean => {
  const coveringStrips = obstacles
    .filter(
      (obstacle) =>
        obstacle.center.x - obstacle.width / 2 <= bounds.minX &&
        obstacle.center.x + obstacle.width / 2 >= bounds.maxX,
    )
    .sort(
      (first, second) =>
        first.center.y -
        first.height / 2 -
        (second.center.y - second.height / 2),
    )
  let coveredThroughY = bounds.minY
  for (const obstacle of coveringStrips) {
    if (obstacle.center.y - obstacle.height / 2 > coveredThroughY) break
    coveredThroughY = Math.max(
      coveredThroughY,
      obstacle.center.y + obstacle.height / 2,
    )
    if (coveredThroughY >= bounds.maxY) return true
  }
  return false
}

/** Keep automatic layer choices out of foreign, unbroken plane copper. */
export const getBreakoutBusesOutsideUnbrokenPours = ({
  routingScope,
  buses,
  regions,
}: {
  routingScope: Group<z.ZodType>
  buses: readonly ImplicitBreakoutBus[]
  regions: readonly { bounds: ImplicitBreakoutBounds }[]
}): ImplicitBreakoutBus[] => {
  const { db } = routingScope.root!
  const connMap = getFullConnectivityMapFromCircuitJson(db.toArray())
  const board = routingScope._getBoard()
  const obstacles = getUnbrokenCopperPourObstacles({
    connMap,
    subcircuitComponent: routingScope.getSubcircuit(),
    board: board?.pcb_board_id ? db.pcb_board.get(board.pcb_board_id) : null,
    group: routingScope.pcb_group_id
      ? db.pcb_group.get(routingScope.pcb_group_id)
      : null,
  })
  if (obstacles.length === 0) return [...buses]

  return buses.map((bus) => {
    const requestedLayers = bus.targetLayers
    // A single requested layer is a hard constraint, not an automatic choice.
    if (!requestedLayers || requestedLayers.length === 1) return bus
    const targetLayers = requestedLayers.filter((layer) => {
      const layerPours = obstacles.filter((obstacle) =>
        obstacle.layers.includes(layer),
      )
      for (const connectionId of bus.connectionIds) {
        const electricalNet = connMap.getNetConnectedToId(connectionId)!
        const foreignPours = layerPours.filter(
          (obstacle) => !obstacle.connectedTo.includes(electricalNet),
        )
        const hasBlockedRegion = regions.some((region) =>
          unbrokenPoursCoverBreakout(region.bounds, foreignPours),
        )
        if (hasBlockedRegion) return false
      }
      return true
    })
    return { ...bus, targetLayers }
  })
}
