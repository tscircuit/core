import dagre, {
  type GraphLabel,
  type NodeConfig,
  type EdgeConfig,
  type Node,
  type GraphEdge,
} from "@dagrejs/dagre"
import type { SystemBlockPageProps } from "@tscircuit/props"
import type { Point } from "circuit-json"
import { applyToPoint, compose, scale, translate } from "transformation-matrix"
import type { SystemBlockTree } from "./collect-system-blocks"
import {
  roundSystemBlockRoute,
  type SystemBlockRouteObstacle,
} from "./round-system-block-route"

/**
 * Dagre works in a top-left frame (+X right, +Y down). All lengths here are mm.
 * Convert its positions (points, not vectors) to page-centered diagram mm,
 * +X right and +Y up, a right-handed XY frame with +Z out of the page.
 * Group membership does not introduce a local coordinate transform.
 */
export function layoutSystemBlocks(
  tree: SystemBlockTree,
  direction: SystemBlockPageProps["direction"],
) {
  // Dagre 2.x's declarations misspell labeloffset as labeloffest.
  const graph = new dagre.graphlib.Graph<
    GraphLabel,
    NodeConfig,
    EdgeConfig & { labeloffset?: number }
  >({
    compound: true,
    multigraph: true,
  })
  graph.setGraph({
    rankdir: ({ right: "LR", left: "RL", down: "TB", up: "BT" } as const)[
      direction ?? "right"
    ],
    // Compound borders need room for the renderer's 12 mm heading area.
    nodesep: 36,
    ranksep: 36,
    edgesep: 16,
    marginx: 8,
    marginy: 8,
  })
  const blocks = [...tree.groups, ...tree.components]
  for (const block of blocks) {
    const { name, displayName, description } = block._parsedProps
    const width = Math.max(
      48,
      Math.min(76, (displayName ?? name).length * 1.7 + 8),
    )
    const descriptionLines = description
      ? Math.ceil(description.length / ((width - 8) / 1.3))
      : 0
    graph.setNode(name, {
      width,
      height: Math.max(24, 12 + descriptionLines * 3.5),
    })
  }
  for (const [block, parent] of tree.parents)
    graph.setParent(block.name, parent.name)
  const edges = tree.connections.map((connection, index) => {
    const { from, to, label } = connection._parsedProps
    const edge = { v: from, w: to, name: `connection_${index}` }
    graph.setEdge(edge, {
      width: label === undefined ? 0 : Math.max(1, label.length * 1.5),
      height: label === undefined ? 0 : 4,
      labelpos: "l",
      labeloffset: 3,
    })
    return edge
  })
  if (blocks.length) dagre.layout(graph)
  const width = Math.max(32, graph.graph().width ?? 0)
  const height = Math.max(24, graph.graph().height ?? 0)
  const toPage = compose(translate(-width / 2, height / 2), scale(1, -1))
  const bounds = new Map(
    blocks.map((block) => {
      // layout() adds resolved coordinates to the input node/edge labels.
      const node = graph.node(block.name) as Node
      return [
        block,
        {
          center: applyToPoint(toPage, { x: node.x!, y: node.y! }),
          width: node.width,
          height: node.height,
        },
      ] as const
    }),
  )
  const obstacles: SystemBlockRouteObstacle[] = blocks.map((block) => {
    const { center, width, height } = bounds.get(block)!
    const top = center.y + height / 2
    return {
      minX: center.x - width / 2,
      maxX: center.x + width / 2,
      minY: tree.groups.some((group) => group === block)
        ? top - 12
        : center.y - height / 2,
      maxY: top,
    }
  })
  for (const [index, connection] of tree.connections.entries()) {
    if (connection._parsedProps.label === undefined) continue
    const edge = graph.edge(edges[index]) as GraphEdge & Point
    const label = applyToPoint(toPage, { x: edge.x!, y: edge.y! })
    obstacles.push({
      minX: label.x - edge.width / 2 - 0.5,
      maxX: label.x + edge.width / 2 + 0.5,
      minY: label.y - edge.height / 2 - 0.5,
      maxY: label.y + edge.height / 2 + 0.5,
    })
  }
  const routes = new Map(
    tree.connections.map((connection, index) => {
      const edge = graph.edge(edges[index]) as GraphEdge & Point
      const route = edge
        .points!.map((point) => applyToPoint(toPage, point))
        .filter(
          (point, index, points) =>
            index === 0 ||
            point.x !== points[index - 1].x ||
            point.y !== points[index - 1].y,
        )
      const label_anchor_center: Point | undefined =
        connection._parsedProps.label === undefined
          ? undefined
          : applyToPoint(toPage, { x: edge.x!, y: edge.y! })
      return [
        connection,
        {
          route: roundSystemBlockRoute(route, obstacles),
          label_anchor_center,
        },
      ] as const
    }),
  )
  return { width, height, bounds, routes }
}
