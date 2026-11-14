import type { Obstacle } from "../obstacles/types"
import type { SimpleRouteBounds, SimpleRouteJson } from "./SimpleRouteJson"

interface CapacityMeshNode {
  capacityMeshNodeId: string
  center: { x: number; y: number }
  width: number
  height: number
  layer: string
  availableZ: number[]
  _depth?: number
  _parent?: CapacityMeshNode
  _containsTarget?: boolean
  _containsObstacle?: boolean
  _completelyInsideObstacle?: boolean
  [key: string]: any
}

const GEOMETRIC_EPSILON = 1e-6
const MIN_OUTSIDE_SLAB_DIMENSION_MM = 0.05

const mapLayerNameToZ = (layerName: string, layerCount: number): number => {
  if (layerName === "top") return 0
  if (layerName === "bottom") return Math.max(0, layerCount - 1)
  if (layerName.startsWith("inner")) {
    const parsed = Number.parseInt(layerName.slice(5), 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

const getObstacleAxisAlignedBounds = (
  obstacle: Obstacle,
  margin: number,
): SimpleRouteBounds => {
  const rotationRadians = ((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
  const cos = Math.abs(Math.cos(rotationRadians))
  const sin = Math.abs(Math.sin(rotationRadians))
  const halfWidth = (obstacle.width * cos + obstacle.height * sin) / 2 + margin
  const halfHeight = (obstacle.width * sin + obstacle.height * cos) / 2 + margin

  return {
    minX: obstacle.center.x - halfWidth,
    maxX: obstacle.center.x + halfWidth,
    minY: obstacle.center.y - halfHeight,
    maxY: obstacle.center.y + halfHeight,
  }
}

const getBlockedZLayersForObstacle = ({
  obstacle,
  layerCount,
  allowBlindAndBuriedVias,
}: {
  obstacle: Obstacle
  layerCount: number
  allowBlindAndBuriedVias: boolean
}): Set<number> => {
  if (!allowBlindAndBuriedVias) {
    if (obstacle.layers.length === 0) return new Set()
    return new Set(Array.from({ length: layerCount }, (_, z) => z))
  }

  return new Set(
    obstacle.layers.map((layer) => mapLayerNameToZ(layer, layerCount)),
  )
}

const partitionAvailableZForKeepout = (
  availableZ: readonly number[],
  blockedZLayers: ReadonlySet<number>,
): number[][] => {
  const sortedZ = [...new Set(availableZ)].sort((a, b) => a - b)
  const groups: number[][] = []

  for (const z of sortedZ) {
    if (blockedZLayers.has(z)) {
      groups.push([z])
      continue
    }
    const previousGroup = groups.at(-1)
    const previousZ = previousGroup?.at(-1)
    if (
      previousGroup &&
      previousZ !== undefined &&
      !blockedZLayers.has(previousZ) &&
      z === previousZ + 1
    ) {
      previousGroup.push(z)
    } else {
      groups.push([z])
    }
  }

  return groups
}

const splitNodeByKeepoutObstacle = ({
  node,
  keepoutBounds,
  blockedZLayers,
  nextNodeIdSuffix,
}: {
  node: CapacityMeshNode
  keepoutBounds: SimpleRouteBounds
  blockedZLayers: ReadonlySet<number>
  nextNodeIdSuffix: () => string
}): CapacityMeshNode[] => {
  if (
    node.availableZ.length <= 1 ||
    node._containsObstacle ||
    node._containsTarget
  ) {
    return [node]
  }

  const partitionedZGroups = partitionAvailableZForKeepout(
    node.availableZ,
    blockedZLayers,
  )
  if (partitionedZGroups.length <= 1) {
    return [node]
  }

  const minX = node.center.x - node.width / 2
  const maxX = node.center.x + node.width / 2
  const minY = node.center.y - node.height / 2
  const maxY = node.center.y + node.height / 2

  const rawIx0 = Math.max(minX, keepoutBounds.minX)
  const rawIx1 = Math.min(maxX, keepoutBounds.maxX)
  const rawIy0 = Math.max(minY, keepoutBounds.minY)
  const rawIy1 = Math.min(maxY, keepoutBounds.maxY)

  if (
    rawIx1 - rawIx0 <= GEOMETRIC_EPSILON ||
    rawIy1 - rawIy0 <= GEOMETRIC_EPSILON
  ) {
    return [node]
  }

  const ix0 = rawIx0 - minX < MIN_OUTSIDE_SLAB_DIMENSION_MM ? minX : rawIx0
  const ix1 = maxX - rawIx1 < MIN_OUTSIDE_SLAB_DIMENSION_MM ? maxX : rawIx1
  const iy0 = rawIy0 - minY < MIN_OUTSIDE_SLAB_DIMENSION_MM ? minY : rawIy0
  const iy1 = maxY - rawIy1 < MIN_OUTSIDE_SLAB_DIMENSION_MM ? maxY : rawIy1

  const resultNodes: CapacityMeshNode[] = []
  let reusedOriginalNodeId = false

  const createPieceNode = (
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    zList: number[],
  ): CapacityMeshNode => {
    const canReuseOriginalNodeId =
      !reusedOriginalNodeId &&
      Math.abs(x0 - minX) <= GEOMETRIC_EPSILON &&
      Math.abs(x1 - maxX) <= GEOMETRIC_EPSILON &&
      Math.abs(y0 - minY) <= GEOMETRIC_EPSILON &&
      Math.abs(y1 - maxY) <= GEOMETRIC_EPSILON
    if (canReuseOriginalNodeId) {
      reusedOriginalNodeId = true
    }

    return {
      ...node,
      capacityMeshNodeId: canReuseOriginalNodeId
        ? node.capacityMeshNodeId
        : `${node.capacityMeshNodeId}_${nextNodeIdSuffix()}`,
      center: {
        x: (x0 + x1) / 2,
        y: (y0 + y1) / 2,
      },
      width: x1 - x0,
      height: y1 - y0,
      availableZ: [...zList],
      layer: `z${zList.join(",")}` as CapacityMeshNode["layer"],
    }
  }

  if (ix0 - minX > GEOMETRIC_EPSILON) {
    resultNodes.push(createPieceNode(minX, ix0, minY, maxY, node.availableZ))
  }
  if (maxX - ix1 > GEOMETRIC_EPSILON) {
    resultNodes.push(createPieceNode(ix1, maxX, minY, maxY, node.availableZ))
  }
  if (iy0 - minY > GEOMETRIC_EPSILON) {
    resultNodes.push(createPieceNode(ix0, ix1, minY, iy0, node.availableZ))
  }
  if (maxY - iy1 > GEOMETRIC_EPSILON) {
    resultNodes.push(createPieceNode(ix0, ix1, iy1, maxY, node.availableZ))
  }

  for (const zGroup of partitionedZGroups) {
    resultNodes.push(createPieceNode(ix0, ix1, iy0, iy1, zGroup))
  }

  return resultNodes
}

export const splitCapacityNodesForAllowTracesKeepouts = ({
  capacityNodes,
  allowTracesKeepoutObstacles,
  viaDiameter,
  viaClearance,
  layerCount,
  allowBlindAndBuriedVias,
}: {
  capacityNodes: CapacityMeshNode[]
  allowTracesKeepoutObstacles: readonly Obstacle[]
  viaDiameter: number
  viaClearance: number
  layerCount: number
  allowBlindAndBuriedVias: boolean
}): CapacityMeshNode[] => {
  if (allowTracesKeepoutObstacles.length === 0) return capacityNodes

  const margin = viaDiameter / 2 + viaClearance
  let splitCounter = 0
  const nextNodeIdSuffix = () => `keepout_${splitCounter++}`

  let currentNodes = capacityNodes
  for (const obstacle of allowTracesKeepoutObstacles) {
    const blockedZLayers = getBlockedZLayersForObstacle({
      obstacle,
      layerCount,
      allowBlindAndBuriedVias,
    })
    if (blockedZLayers.size === 0) continue

    const keepoutBounds = getObstacleAxisAlignedBounds(obstacle, margin)
    currentNodes = currentNodes.flatMap((node) =>
      splitNodeByKeepoutObstacle({
        node,
        keepoutBounds,
        blockedZLayers,
        nextNodeIdSuffix,
      }),
    )
  }

  return currentNodes
}

const doesPointOverlapObstacleWithRadius = (
  point: { x: number; y: number },
  obstacle: Obstacle,
  radius: number,
): boolean => {
  const dx = point.x - obstacle.center.x
  const dy = point.y - obstacle.center.y
  const rotationRadians = -((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
  const cos = Math.cos(rotationRadians)
  const sin = Math.sin(rotationRadians)
  const localX = Math.abs(dx * cos - dy * sin)
  const localY = Math.abs(dx * sin + dy * cos)

  if (obstacle.shape === "circle") {
    const obsRadius = Math.min(obstacle.width, obstacle.height) / 2
    return Math.hypot(dx, dy) <= obsRadius + radius + GEOMETRIC_EPSILON
  }

  const clampedX = Math.max(0, localX - obstacle.width / 2)
  const clampedY = Math.max(0, localY - obstacle.height / 2)
  return Math.hypot(clampedX, clampedY) <= radius + GEOMETRIC_EPSILON
}

const routeHasViaOverlappingAllowTracesKeepout = ({
  route,
  allowTracesKeepoutObstacles,
  defaultViaDiameter,
  layerCount,
  allowBlindAndBuriedVias,
}: {
  route: {
    viaDiameter?: number
    vias?: ReadonlyArray<{ x: number; y: number }>
    route?: ReadonlyArray<{
      x: number
      y: number
      z: number
      toNextSegmentType?: string
    }>
  }
  allowTracesKeepoutObstacles: readonly Obstacle[]
  defaultViaDiameter: number
  layerCount: number
  allowBlindAndBuriedVias: boolean
}): boolean => {
  const viaRadius = (route.viaDiameter ?? defaultViaDiameter) / 2
  const routePoints = route.route ?? []

  for (const obstacle of allowTracesKeepoutObstacles) {
    const blockedZLayers = getBlockedZLayersForObstacle({
      obstacle,
      layerCount,
      allowBlindAndBuriedVias,
    })
    if (blockedZLayers.size === 0) continue

    if (!allowBlindAndBuriedVias) {
      for (const via of route.vias ?? []) {
        if (doesPointOverlapObstacleWithRadius(via, obstacle, viaRadius)) {
          return true
        }
      }
    }

    for (let i = 1; i < routePoints.length; i++) {
      const prev = routePoints[i - 1]!
      const curr = routePoints[i]!
      if (prev.z === curr.z || prev.toNextSegmentType === "through_obstacle") {
        continue
      }
      const minZ = Math.min(prev.z, curr.z)
      const maxZ = Math.max(prev.z, curr.z)
      let spansBlockedLayer = !allowBlindAndBuriedVias
      if (!spansBlockedLayer) {
        for (let z = minZ; z <= maxZ; z++) {
          if (blockedZLayers.has(z)) {
            spansBlockedLayer = true
            break
          }
        }
      }
      if (!spansBlockedLayer) continue

      if (
        doesPointOverlapObstacleWithRadius(prev, obstacle, viaRadius) ||
        doesPointOverlapObstacleWithRadius(curr, obstacle, viaRadius)
      ) {
        return true
      }
    }
  }

  return false
}

export const applyAllowTracesKeepoutViaRestrictions = (
  solver: unknown,
  inputSrj: SimpleRouteJson,
): void => {
  const allowTracesKeepoutObstacles = inputSrj.allowTracesKeepoutObstacles
  if (
    !allowTracesKeepoutObstacles ||
    allowTracesKeepoutObstacles.length === 0
  ) {
    return
  }

  const pipelineSolver = solver as {
    pipelineDef?: Array<{
      solverName: string
      solverClass: new (...args: any[]) => any
      getConstructorParams: (instance: any) => any[]
      onSolved?: (instance: any) => void
    }>
  }
  if (!Array.isArray(pipelineSolver.pipelineDef)) return

  const getViaConfig = (cms: any) => {
    const viaDiameter = Number(
      cms.viaDiameter ??
        inputSrj.minViaPadDiameter ??
        inputSrj.min_via_pad_diameter ??
        inputSrj.minViaDiameter ??
        0.3,
    )
    const viaClearance = Number(
      cms.srj?.minViaEdgeToPadEdgeClearance ??
        cms.srj?.defaultObstacleMargin ??
        inputSrj.minViaEdgeToPadEdgeClearance ??
        inputSrj.defaultObstacleMargin ??
        0.15,
    )
    const layerCount = Number(cms.srj?.layerCount ?? inputSrj.layerCount ?? 2)
    const allowBlindAndBuriedVias = Boolean(
      cms.srj?.allowBlindAndBuriedVias ??
        inputSrj.allowBlindAndBuriedVias ??
        false,
    )
    return { viaDiameter, viaClearance, layerCount, allowBlindAndBuriedVias }
  }

  for (const step of pipelineSolver.pipelineDef) {
    if (step.solverName === "edgeSolver") {
      const originalGetConstructorParams = step.getConstructorParams
      step.getConstructorParams = (cms: any) => {
        if (Array.isArray(cms.capacityNodes)) {
          const {
            viaDiameter,
            viaClearance,
            layerCount,
            allowBlindAndBuriedVias,
          } = getViaConfig(cms)
          cms.capacityNodes = splitCapacityNodesForAllowTracesKeepouts({
            capacityNodes: cms.capacityNodes,
            allowTracesKeepoutObstacles,
            viaDiameter,
            viaClearance,
            layerCount,
            allowBlindAndBuriedVias,
          })
        }
        return originalGetConstructorParams(cms)
      }
    }

    if (
      step.solverName === "traceSimplificationSolver" ||
      step.solverName === "mutatedPreloadedTraceSimplificationSolver"
    ) {
      const originalOnSolved = step.onSolved
      step.onSolved = (cms: any) => {
        originalOnSolved?.(cms)
        const simplificationSolver = cms[step.solverName]
        const simplifiedRoutes: any[] | undefined =
          simplificationSolver?.simplifiedHdRoutes
        if (!Array.isArray(simplifiedRoutes)) return

        const { viaDiameter, layerCount, allowBlindAndBuriedVias } =
          getViaConfig(cms)
        const hasIllegalVia = simplifiedRoutes.some((route) =>
          routeHasViaOverlappingAllowTracesKeepout({
            route,
            allowTracesKeepoutObstacles,
            defaultViaDiameter: viaDiameter,
            layerCount,
            allowBlindAndBuriedVias,
          }),
        )
        if (!hasIllegalVia) return

        const [params] = step.getConstructorParams(cms)
        if (params && typeof params === "object") {
          const fallbackSolver = new step.solverClass({
            ...params,
            enableCrossingViaReduction: false,
          })
          fallbackSolver.solve()
          if (fallbackSolver.solved) {
            simplificationSolver.hdRoutes = fallbackSolver.simplifiedHdRoutes
          }
        }
      }
    }

    if (step.solverName === "effortCleanupSolver") {
      const originalGetConstructorParams = step.getConstructorParams
      step.getConstructorParams = (cms: any) => {
        const params = originalGetConstructorParams(cms)
        const [firstParam] = params
        if (firstParam && typeof firstParam.isValid === "function") {
          const originalIsValid = firstParam.isValid
          const { viaDiameter, layerCount, allowBlindAndBuriedVias } =
            getViaConfig(cms)
          firstParam.isValid = (routes: any[]) => {
            if (
              Array.isArray(routes) &&
              routes.some((route) =>
                routeHasViaOverlappingAllowTracesKeepout({
                  route,
                  allowTracesKeepoutObstacles,
                  defaultViaDiameter: viaDiameter,
                  layerCount,
                  allowBlindAndBuriedVias,
                }),
              )
            ) {
              return false
            }
            return originalIsValid(routes)
          }
        }
        return params
      }
    }
  }
}
