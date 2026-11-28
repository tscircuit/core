import type { LayerRef, PcbBoard, PcbGroup, Point } from "circuit-json"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { CopperPour } from "lib/components/primitive-components/CopperPour/CopperPour"
import type { ISubcircuit } from "lib/components/primitive-components/Group/Subcircuit/ISubcircuit"
import type { Net } from "lib/components/primitive-components/Net"
import { fillPolygonWithRects } from "lib/utils/obstacles/fillPolygonWithRects"
import type { Obstacle } from "lib/utils/obstacles/types"

type CopperPourContainer = Pick<ISubcircuit, "selectAll">

const COPPER_POUR_RECT_HEIGHT = 0.5

const dedupeStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))))

const createCopperPourObstacle = ({
  layer,
  connectedTo,
  center,
  width,
  height,
}: {
  layer: LayerRef
  connectedTo: string[]
  center: Point
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
  net: Pick<Net, "source_net_id" | "subcircuit_connectivity_map_key">,
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
  subcircuitComponent?: CopperPourContainer
  board?: PcbBoard | null
  group?: PcbGroup | null
}): Obstacle[] => {
  if (!subcircuitComponent) return []

  const obstacles: Obstacle[] = []
  const copperPours = subcircuitComponent.selectAll<CopperPour>("copperpour")

  for (const copperPour of copperPours) {
    const props = copperPour._parsedProps
    if (!props.unbroken) continue

    const net = copperPour.getSubcircuit().selectOne<Net>(props.connectsTo)
    if (!net?.source_net_id) continue

    const layer = copperPour.resolvePcbLayer()
    const connectedTo = getCopperPourConnectedTo(net, connMap)
    if (connectedTo.length === 0) continue

    const boundary = getCopperPourBoundary({
      outline: copperPour.resolveBoardWorldOutline(),
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
