import type { LayerRef, PcbBoard, PcbGroup } from "circuit-json"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { getBoardAvailableLayers } from "lib/utils/getViaSpanLayers"
import { fillPolygonWithRects } from "lib/utils/obstacles/fillPolygonWithRects"
import type { Obstacle } from "lib/utils/obstacles/types"
import type {
  SimpleRouteBounds,
  SimpleRouteConnection,
} from "./SimpleRouteJson"

type Point = { x: number; y: number }

type NetLike = {
  name?: string
  source_net_id?: string
  subcircuit_connectivity_map_key?: string | null
}

type LayerInputLike = LayerRef | { name: string }

type BoardPlanePropsLike = {
  layers?: number
  routingLayers?: LayerInputLike[]
  planeLayers?: Partial<Record<string, string | string[]>>
}

type CopperPourLike = {
  _parsedProps: {
    layer: LayerInputLike
    connectsTo: string
    unbroken?: boolean
    outline?: Point[]
  }
  getSubcircuit(): {
    selectOne<T = unknown>(selector: string): T | null
  }
}

type CopperPourContainerLike = {
  selectAll(selector: string): unknown[]
  selectOne?<T = unknown>(selector: string): T | null
  _getBoard?():
    | {
        _parsedProps?: BoardPlanePropsLike
        selectOne?<T = unknown>(selector: string): T | null
      }
    | null
    | undefined
  _parsedProps?: BoardPlanePropsLike
}

const COPPER_POUR_RECT_HEIGHT = 0.5

const dedupeStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))))

const getLayerName = (layer: LayerInputLike | string): string =>
  typeof layer === "string" ? layer : layer.name

const createCopperPourObstacle = ({
  layer,
  connectedTo,
  center,
  width,
  height,
}: {
  layer: string
  connectedTo: string[]
  center: { x: number; y: number }
  width: number
  height: number
}): Obstacle => ({
  type: "rect",
  layers: [layer],
  center,
  width,
  height,
  connectedTo,
  isCopperPour: true,
})

const getCopperPourBoundary = ({
  outline,
  group,
  board,
}: {
  outline?: Point[]
  group?: Pick<PcbGroup, "outline"> | null
  board?: Pick<PcbBoard, "outline"> | null
}): Point[] | null => {
  if (outline && outline.length >= 3) return outline
  if (group?.outline && group.outline.length >= 3) return group.outline
  if (board?.outline && board.outline.length >= 3) return board.outline
  return null
}

const getCopperPourBoundsRect = ({
  group,
  board,
}: {
  group?: Pick<PcbGroup, "center" | "width" | "height"> | null
  board?: Pick<PcbBoard, "center" | "width" | "height"> | null
}): {
  center: { x: number; y: number }
  width: number
  height: number
} | null => {
  if (group?.width && group.height) {
    return {
      center: group.center,
      width: group.width,
      height: group.height,
    }
  }

  if (board?.width && board.height) {
    return {
      center: board.center,
      width: board.width,
      height: board.height,
    }
  }

  return null
}

const emitCopperPourObstaclesForRegion = ({
  layer,
  connectedTo,
  outline,
  group,
  board,
}: {
  layer: string
  connectedTo: string[]
  outline?: Point[]
  group?: Pick<PcbGroup, "outline" | "center" | "width" | "height"> | null
  board?: Pick<PcbBoard, "outline" | "center" | "width" | "height"> | null
}): Obstacle[] => {
  const boundary = getCopperPourBoundary({
    outline,
    group,
    board,
  })
  if (boundary) {
    const rects = fillPolygonWithRects(boundary, {
      rectHeight: COPPER_POUR_RECT_HEIGHT,
    })
    if (rects.length > 0) {
      return rects.map((rect) =>
        createCopperPourObstacle({
          layer,
          connectedTo,
          center: rect.center,
          width: rect.width,
          height: rect.height,
        }),
      )
    }
  }

  const boundsRect = getCopperPourBoundsRect({ group, board })
  if (!boundsRect) return []

  return [
    createCopperPourObstacle({
      layer,
      connectedTo,
      center: boundsRect.center,
      width: boundsRect.width,
      height: boundsRect.height,
    }),
  ]
}

const getCopperPourConnectedTo = (
  net: NetLike,
  connMap: ConnectivityMap,
): string[] =>
  dedupeStrings([
    net.source_net_id,
    net.subcircuit_connectivity_map_key,
    net.source_net_id ? connMap.getNetConnectedToId(net.source_net_id) : null,
  ])

const resolvePlaneNets = ({
  netSpecifiers,
  sourceNets,
  boardComponent,
  subcircuitComponent,
}: {
  netSpecifiers: readonly string[]
  sourceNets?: readonly NetLike[]
  boardComponent?: {
    selectOne?<T = unknown>(selector: string): T | null
  } | null
  subcircuitComponent?: CopperPourContainerLike
}): NetLike[] => {
  const matchedNets: NetLike[] = []
  for (const rawNet of netSpecifiers) {
    const trimmed = rawNet.trim()
    if (!trimmed) continue
    const bareName = trimmed.replace(/^net\./, "")
    const netSelector = trimmed.startsWith("net.") ? trimmed : `net.${trimmed}`

    for (const sourceNet of sourceNets ?? []) {
      if (sourceNet.name === bareName || sourceNet.name === trimmed) {
        matchedNets.push(sourceNet)
      }
    }

    const selectedFromSubcircuit =
      subcircuitComponent?.selectOne?.<NetLike>(netSelector) ??
      boardComponent?.selectOne?.<NetLike>(netSelector)
    if (selectedFromSubcircuit?.source_net_id) {
      matchedNets.push(selectedFromSubcircuit)
    }
  }
  return matchedNets
}

export const getUnbrokenCopperPourObstacles = ({
  connMap,
  subcircuitComponent,
  board,
  group,
  sourceNets,
}: {
  connMap: ConnectivityMap
  subcircuitComponent?: CopperPourContainerLike
  board?: PcbBoard | null
  group?: PcbGroup | null
  sourceNets?: readonly NetLike[]
}): Obstacle[] => {
  if (!subcircuitComponent) return []

  const obstacles: Obstacle[] = []
  const reservedFullBoardLayers = new Set<string>()
  const copperPours = subcircuitComponent.selectAll(
    "copperpour",
  ) as CopperPourLike[]

  for (const copperPour of copperPours) {
    const props = copperPour._parsedProps
    if (!props.unbroken) continue

    const net = copperPour.getSubcircuit().selectOne<NetLike>(props.connectsTo)
    if (!net?.source_net_id) continue

    const layer = getLayerName(props.layer)
    const connectedTo = getCopperPourConnectedTo(net, connMap)
    if (connectedTo.length === 0) continue

    const emitted = emitCopperPourObstaclesForRegion({
      layer,
      connectedTo,
      outline: props.outline,
      group,
      board,
    })
    if (emitted.length > 0) {
      obstacles.push(...emitted)
      if (!props.outline) {
        reservedFullBoardLayers.add(layer)
      }
    }
  }

  const boardComponent =
    subcircuitComponent._getBoard?.() ?? subcircuitComponent
  const boardProps =
    boardComponent?._parsedProps ?? subcircuitComponent._parsedProps

  if (boardProps?.planeLayers) {
    for (const [rawLayer, rawNets] of Object.entries(boardProps.planeLayers)) {
      if (!rawNets) continue
      const layer = getLayerName(rawLayer)
      if (reservedFullBoardLayers.has(layer)) continue
      const netSpecifiers = Array.isArray(rawNets) ? rawNets : [rawNets]
      const matchedNets = resolvePlaneNets({
        netSpecifiers,
        sourceNets,
        boardComponent,
        subcircuitComponent,
      })
      const connectedTo = dedupeStrings(
        matchedNets.flatMap((net) => getCopperPourConnectedTo(net, connMap)),
      )
      const emitted = emitCopperPourObstaclesForRegion({
        layer,
        connectedTo,
        group,
        board,
      })
      if (emitted.length > 0) {
        obstacles.push(...emitted)
        reservedFullBoardLayers.add(layer)
      }
    }
  }

  if (boardProps?.routingLayers && boardProps.routingLayers.length > 0) {
    const layerCount = board?.num_layers ?? boardProps.layers ?? 2
    const allBoardLayers = getBoardAvailableLayers(layerCount)
    const allowedRoutingLayers = new Set(
      boardProps.routingLayers.map((layer) => getLayerName(layer)),
    )
    for (const layer of allBoardLayers) {
      if (
        allowedRoutingLayers.has(layer) ||
        reservedFullBoardLayers.has(layer)
      ) {
        continue
      }
      const emitted = emitCopperPourObstaclesForRegion({
        layer,
        connectedTo: [],
        group,
        board,
      })
      if (emitted.length > 0) {
        obstacles.push(...emitted)
        reservedFullBoardLayers.add(layer)
      }
    }
  }

  return obstacles
}

export const getDisallowedLayerObstaclesForConnections = ({
  connections,
  layerCount,
  bounds,
  outline,
  existingObstacles,
}: {
  connections: readonly SimpleRouteConnection[]
  layerCount: number
  bounds: SimpleRouteBounds
  outline?: Point[]
  existingObstacles: readonly Obstacle[]
}): Obstacle[] => {
  if (connections.length === 0) return []
  const everyConnectionHasAllowedLayers = connections.every(
    (connection) =>
      Array.isArray(connection.allowedLayers) &&
      connection.allowedLayers.length > 0,
  )
  if (!everyConnectionHasAllowedLayers) return []

  const unionAllowedLayers = new Set(
    connections.flatMap((connection) => connection.allowedLayers ?? []),
  )
  const allBoardLayers = getBoardAvailableLayers(layerCount)
  const boundsWidth = bounds.maxX - bounds.minX
  const boundsHeight = bounds.maxY - bounds.minY
  if (boundsWidth <= 0 || boundsHeight <= 0) return []

  const alreadyBlockedLayers = new Set<string>()
  for (const obstacle of existingObstacles) {
    if (!obstacle.isCopperPour) continue
    for (const layer of obstacle.layers) {
      if (
        obstacle.connectedTo.length === 0 ||
        (obstacle.width >= boundsWidth * 0.9 &&
          obstacle.height >= boundsHeight * 0.9)
      ) {
        alreadyBlockedLayers.add(layer)
      }
    }
  }

  const SyntheticBoardRegion = {
    center: {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    },
    width: boundsWidth,
    height: boundsHeight,
    outline,
  }

  const obstacles: Obstacle[] = []
  for (const layer of allBoardLayers) {
    if (unionAllowedLayers.has(layer) || alreadyBlockedLayers.has(layer)) {
      continue
    }
    obstacles.push(
      ...emitCopperPourObstaclesForRegion({
        layer,
        connectedTo: [],
        outline,
        board: SyntheticBoardRegion,
      }),
    )
  }

  return obstacles
}
