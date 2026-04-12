import type { LayerRef, PcbBoard, PcbGroup } from "circuit-json"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { Obstacle } from "lib/utils/obstacles/types"
import { fillPolygonWithRects } from "lib/utils/obstacles/fillPolygonWithRects"

type Point = { x: number; y: number }

type NetLike = {
  source_net_id?: string
  subcircuit_connectivity_map_key?: string | null
}

type CopperPourLike = {
  _parsedProps: {
    layer: LayerRef | { name: string }
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
}

const COPPER_POUR_RECT_HEIGHT = 0.5

const dedupeStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))))

const getLayerName = (layer: LayerRef | { name: string }): string =>
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

const getCopperPourConnectedTo = (
  net: NetLike,
  connMap: ConnectivityMap,
): string[] =>
  dedupeStrings([
    net.source_net_id,
    net.subcircuit_connectivity_map_key,
    net.source_net_id ? connMap.getNetConnectedToId(net.source_net_id) : null,
  ])

export const getUnbrokenCopperPourObstacles = ({
  connMap,
  subcircuitComponent,
  board,
  group,
}: {
  connMap: ConnectivityMap
  subcircuitComponent?: CopperPourContainerLike
  board?: PcbBoard | null
  group?: PcbGroup | null
}): Obstacle[] => {
  if (!subcircuitComponent) return []

  const obstacles: Obstacle[] = []
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

    const boundary = getCopperPourBoundary({
      outline: props.outline,
      group,
      board,
    })
    if (boundary) {
      const rects = fillPolygonWithRects(boundary, {
        rectHeight: COPPER_POUR_RECT_HEIGHT,
      })
      if (rects.length > 0) {
        obstacles.push(
          ...rects.map((rect) =>
            createCopperPourObstacle({
              layer,
              connectedTo,
              center: rect.center,
              width: rect.width,
              height: rect.height,
            }),
          ),
        )
        continue
      }
    }

    const boundsRect = getCopperPourBoundsRect({ group, board })
    if (!boundsRect) continue

    obstacles.push(
      createCopperPourObstacle({
        layer,
        connectedTo,
        center: boundsRect.center,
        width: boundsRect.width,
        height: boundsRect.height,
      }),
    )
  }

  return obstacles
}
