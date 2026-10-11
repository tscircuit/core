import { getPourPolygon } from "@tscircuit/circuit-json-util"
import type { PcbCopperPour } from "circuit-json"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { fillCopperPolygonWithRects } from "lib/utils/obstacles/fillCopperPolygonWithRects"
import type { Obstacle } from "lib/utils/obstacles/types"

/**
 * Preserves already-generated copper for standalone routing handoffs. Inputs
 * are circuit-world mm points (+X right, +Y up); no transform is applied.
 * The exact input BREP is unchanged. SRJ's rectangle-only obstacle contract
 * receives a conservative cover with the original layer and net ownership.
 */
export const getExistingCopperPourObstacles = ({
  copperPours,
  connMap,
  maxBoundaryError,
}: {
  copperPours: readonly PcbCopperPour[]
  connMap: ConnectivityMap
  maxBoundaryError: number
}): Obstacle[] =>
  copperPours.flatMap((pour) => {
    const copperNetId = pour.source_net_id ?? pour.pcb_copper_pour_id
    const connectedNetId = pour.source_net_id
      ? connMap.getNetConnectedToId(pour.source_net_id)
      : null
    const copperNetIds = [
      copperNetId,
      ...(connectedNetId ? [connectedNetId] : []),
    ]
    const connectedTo = Array.from(
      new Set([
        ...copperNetIds,
        ...copperNetIds.flatMap((netId) => connMap.getIdsConnectedToNet(netId)),
      ]),
    )
    return fillCopperPolygonWithRects(
      getPourPolygon(pour),
      maxBoundaryError,
    ).map((rect, rectIndex) => ({
      ...rect,
      type: "rect",
      obstacleId: `${pour.pcb_copper_pour_id}_${rectIndex}`,
      layers: [pour.layer],
      connectedTo,
      isCopperPour: true,
    }))
  })
