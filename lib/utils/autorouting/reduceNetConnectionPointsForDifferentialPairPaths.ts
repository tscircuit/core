import type {
  SimpleRouteConnection,
  SingleLayerConnectionPoint,
} from "./SimpleRouteJson"

type SrjPointId = NonNullable<SingleLayerConnectionPoint["pointId"]>

/**
 * Keep one net terminal per connected set of explicitly requested pair paths.
 * Those paths remain routing requests, not existing copper. The residual net
 * request joins their sets to any remaining taps without routing the trunks
 * twice. Route points are copied unchanged in right-handed circuit-world mm
 * (+X right, +Y up, +Z above the board); no geometry transform is performed.
 */
export const reduceNetConnectionPointsForDifferentialPairPaths = ({
  netConnections,
  differentialPairConnections,
}: {
  netConnections: SimpleRouteConnection[]
  differentialPairConnections: SimpleRouteConnection[]
}): void => {
  if (differentialPairConnections.length === 0) return
  const parentPointId = new Map<SrjPointId, SrjPointId>()
  const root = (pointId: SrjPointId): SrjPointId => {
    const parent = parentPointId.get(pointId)
    if (parent === undefined || parent === pointId) return pointId
    const representative = root(parent)
    parentPointId.set(pointId, representative)
    return representative
  }
  for (const connection of differentialPairConnections) {
    const pointIds = connection.pointsToConnect.flatMap((point) =>
      point.pointId ? [point.pointId] : [],
    )
    for (const pointId of pointIds.slice(1)) {
      parentPointId.set(root(pointId), root(pointIds[0]))
    }
  }
  for (const netConnection of netConnections) {
    const representedPointIds = new Set<SrjPointId>()
    netConnection.pointsToConnect = netConnection.pointsToConnect.filter(
      (point) => {
        if (!point.pointId) return true // Preserve explicit trace hints.
        const representative = root(point.pointId)
        if (representedPointIds.has(representative)) return false
        representedPointIds.add(representative)
        return true
      },
    )
  }
}
