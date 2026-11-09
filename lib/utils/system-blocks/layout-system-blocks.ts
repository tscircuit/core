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
import type { SystemBlockName, SystemBlockTree } from "./collect-system-blocks"
import { roundSystemBlockConnections } from "./round-system-block-connections"
import {
  routeSystemBlocks,
  getSystemConnectionLabelWidth,
  type SystemBlockBounds,
  type SystemConnectionRoute,
} from "./route-system-blocks"

import type { SystemBlockGroup } from "lib/components/primitive-components/SystemBlockGroup"
import type { SystemBlockComponent } from "lib/components/primitive-components/SystemBlockComponent"
import type { SystemBlockConnection } from "lib/components/primitive-components/SystemBlockConnection"
type SystemLayoutBlock = SystemBlockGroup | SystemBlockComponent
type ContainerLayout = {
  width: number
  height: number
  bounds: Map<SystemLayoutBlock, SystemBlockBounds>
  routes: Map<SystemBlockConnection, SystemConnectionRoute>
}

/**
 * Lay out each subsystem independently, then rank its box alongside its peers.
 * Unlike a flat compound graph, unrelated descendants do not share global ranks
 * and cannot stretch a subsystem across the entire diagram.
 * Dagre positions are top-left-origin diagram mm (+X right, +Y down). Convert
 * points once at the boundary to page-centered mm (+X right, +Y up), then route.
 */
export function layoutSystemBlocks(
  tree: SystemBlockTree,
  direction: SystemBlockPageProps["direction"],
) {
  const degrees = new Map<SystemBlockName, number>()
  for (const {
    _parsedProps: { from, to },
  } of tree.connections) {
    degrees.set(from, (degrees.get(from) ?? 0) + 1)
    degrees.set(to, (degrees.get(to) ?? 0) + 1)
  }
  const layout = layoutContainer(tree, undefined, direction ?? "right", degrees)
  const toPage = compose(
    translate(-layout.width / 2, layout.height / 2),
    scale(1, -1),
  )
  for (const box of layout.bounds.values())
    box.center = applyToPoint(toPage, box.center)
  for (const [connection, resolved] of layout.routes) {
    resolved.route = resolved.route.map((point) => applyToPoint(toPage, point))
    if (resolved.label_anchor_center)
      resolved.label_anchor_center = applyToPoint(
        toPage,
        resolved.label_anchor_center,
      )
    const endpoints = tree.endpoints.get(connection)!
    // Cross-subsystem edges initially end at the subsystem box. Move their
    // routing hints to the actual component boundary; group borders are not ports.
    for (const [block, index] of [
      [endpoints.from, 0],
      [endpoints.to, resolved.route.length - 1],
    ] as const) {
      const box = layout.bounds.get(block)!
      const point = resolved.route[index]
      let dx = point.x - box.center.x,
        dy = point.y - box.center.y
      if (dx === 0 && dy === 0) {
        const neighbor = resolved.route[index === 0 ? 1 : index - 1]
        dx = neighbor.x - point.x
        dy = neighbor.y - point.y
      }
      const factor = Math.max(
        Math.abs(dx) / (box.width / 2),
        Math.abs(dy) / (box.height / 2),
      )
      resolved.route[index] = {
        x: box.center.x + dx / factor,
        y: box.center.y + dy / factor,
      }
    }
  }
  const routes = roundSystemBlockConnections(
    tree,
    layout.bounds,
    routeSystemBlocks(tree, layout.bounds, layout.routes),
  )
  let width = layout.width,
    height = layout.height
  // Outer detours and relocated label rectangles remain in the same frame.
  for (const [connection, resolved] of routes) {
    for (const point of resolved.route) {
      width = Math.max(width, 2 * (Math.abs(point.x) + 6))
      height = Math.max(height, 2 * (Math.abs(point.y) + 6))
    }
    if (resolved.label_anchor_center) {
      width = Math.max(
        width,
        2 *
          (Math.abs(resolved.label_anchor_center.x) +
            getSystemConnectionLabelWidth(connection._parsedProps.label!) / 2 +
            6),
      )
      height = Math.max(
        height,
        2 * (Math.abs(resolved.label_anchor_center.y) + 8),
      )
    }
  }
  return { width, height, bounds: layout.bounds, routes }
}

/** Container-local diagram mm: top-left origin, +X right, +Y down; all centers are points. */
function layoutContainer(
  tree: SystemBlockTree,
  parent: SystemBlockGroup | undefined,
  direction: NonNullable<SystemBlockPageProps["direction"]>,
  degrees: Map<SystemBlockName, number>,
): ContainerLayout {
  const children: SystemLayoutBlock[] = [
    ...tree.groups,
    ...tree.components,
  ].filter((block) => tree.parents.get(block) === parent)
  const groupLayouts = new Map<SystemBlockGroup, ContainerLayout>()
  // Dagre 2.x declarations misspell labeloffset as labeloffest.
  const graph = new dagre.graphlib.Graph<
    GraphLabel,
    NodeConfig,
    EdgeConfig & { labeloffset?: number }
  >({ multigraph: true })
  graph.setGraph({
    rankdir: ({ right: "LR", left: "RL", down: "TB", up: "BT" } as const)[
      direction
    ],
    nodesep: parent ? 12 : 18,
    ranksep: 18,
    edgesep: 8,
    marginx: 8,
    marginy: 8,
  })
  for (const block of children) {
    if (tree.groups.includes(block as SystemBlockGroup)) {
      const child = layoutContainer(
        tree,
        block as SystemBlockGroup,
        direction,
        degrees,
      )
      groupLayouts.set(block as SystemBlockGroup, child)
      graph.setNode(block.name, { width: child.width, height: child.height })
    } else {
      const { name, displayName, description } = block._parsedProps
      const width = Math.max(
        32,
        Math.min(62, (displayName ?? name).length * 1.5 + 8),
      )
      const descriptionLines = description
        ? Math.ceil(description.length / ((width - 8) / 1.3))
        : 0
      graph.setNode(name, {
        width,
        height: Math.max(18, 12 + descriptionLines * 3.5),
      })
    }
  }
  const childFor = (
    block: SystemLayoutBlock,
  ): SystemLayoutBlock | undefined => {
    let current: SystemLayoutBlock | undefined = block
    while (current && tree.parents.get(current) !== parent)
      current = tree.parents.get(current)
    return current
  }
  const edges = new Map<
    SystemBlockConnection,
    { v: SystemBlockName; w: SystemBlockName; name: string }
  >()
  for (const [index, connection] of tree.connections.entries()) {
    const endpoints = tree.endpoints.get(connection)!
    const from = childFor(endpoints.from),
      to = childFor(endpoints.to)
    if (
      !from ||
      !to ||
      (from === to && (from !== endpoints.from || to !== endpoints.to))
    )
      continue
    const props = connection._parsedProps
    // Two-way interfaces have no flow constraint. Favor the controller/hub
    // rather than making peripheral-to-controller declarations feedback edges.
    const reverse =
      props.direction === "both" &&
      degrees.get(props.to)! > degrees.get(props.from)!
    const edge = {
      v: (reverse ? to : from).name,
      w: (reverse ? from : to).name,
      name: `connection_${index}`,
    }
    graph.setEdge(edge, {
      width:
        props.label === undefined
          ? 0
          : getSystemConnectionLabelWidth(props.label),
      height: props.label === undefined ? 0 : 5,
      labelpos: "c",
      labeloffset: 0,
    })
    edges.set(connection, edge)
  }
  if (children.length) dagre.layout(graph)
  const heading = parent ? (parent._parsedProps.description ? 14 : 8) : 0
  const minimumWidth = parent
    ? Math.min(
        90,
        (parent._parsedProps.displayName ?? parent.name).length * 1.8 + 8,
      )
    : 32
  const width = Math.max(minimumWidth, graph.graph().width ?? 0)
  const height = Math.max(24, (graph.graph().height ?? 0) + heading)
  const bounds = new Map<SystemLayoutBlock, SystemBlockBounds>()
  const routes = new Map<SystemBlockConnection, SystemConnectionRoute>()
  for (const block of children) {
    const node = graph.node(block.name) as Node
    bounds.set(block, {
      center: { x: node.x!, y: node.y! + heading },
      width: node.width,
      height: node.height,
    })
    const child = groupLayouts.get(block as SystemBlockGroup)
    if (!child) continue
    const offset = {
      x: node.x! - child.width / 2,
      y: node.y! + heading - child.height / 2,
    }
    const shift = (point: Point): Point => ({
      x: point.x + offset.x,
      y: point.y + offset.y,
    })
    for (const [descendant, box] of child.bounds)
      bounds.set(descendant, { ...box, center: shift(box.center) })
    for (const [connection, resolved] of child.routes)
      routes.set(connection, {
        route: resolved.route.map(shift),
        label_anchor_center: resolved.label_anchor_center
          ? shift(resolved.label_anchor_center)
          : undefined,
      })
  }
  for (const [connection, edgeKey] of edges) {
    const edge = graph.edge(edgeKey) as GraphEdge & Point
    const route = edge.points!.map((point) => ({
      x: point.x,
      y: point.y + heading,
    }))
    const from = childFor(tree.endpoints.get(connection)!.from)!
    if (edgeKey.v !== from.name) route.reverse()
    routes.set(connection, {
      route,
      label_anchor_center:
        connection._parsedProps.label === undefined
          ? undefined
          : { x: edge.x, y: edge.y + heading },
    })
  }
  // Parallel cross-subsystem links share a rank but lead to different children.
  // Assign their label slots in child order, rather than declaration order, so
  // the router does not have to braid wires merely to reach their labels.
  const bundles = new Map<
    SystemBlockName,
    Map<SystemBlockName, SystemBlockConnection[]>
  >()
  for (const [connection, edge] of edges) {
    if (connection._parsedProps.label === undefined) continue
    const targets =
      bundles.get(edge.v) ?? new Map<SystemBlockName, SystemBlockConnection[]>()
    const connections = targets.get(edge.w) ?? []
    connections.push(connection)
    targets.set(edge.w, connections)
    bundles.set(edge.v, targets)
  }
  const crossAxis = direction === "right" || direction === "left" ? "y" : "x"
  for (const targets of bundles.values()) {
    for (const connections of targets.values()) {
      const slots = connections
        .map((c) => routes.get(c)!.label_anchor_center!)
        .sort((a, b) => a[crossAxis] - b[crossAxis])
      const destinationPosition = (connection: SystemBlockConnection) => {
        const endpoints = tree.endpoints.get(connection)!
        const targetChild = edges.get(connection)!.w
        const endpoint =
          childFor(endpoints.to)!.name === targetChild
            ? endpoints.to
            : endpoints.from
        return bounds.get(endpoint)!.center[crossAxis]
      }
      connections.sort(
        (a, b) => destinationPosition(a) - destinationPosition(b),
      )
      connections.forEach((connection, index) => {
        routes.get(connection)!.label_anchor_center = slots[index]
      })
    }
  }
  return { width, height, bounds, routes }
}
