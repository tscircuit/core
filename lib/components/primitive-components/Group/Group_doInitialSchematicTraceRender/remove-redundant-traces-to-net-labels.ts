import { distance, pointToSegmentDistance } from "@tscircuit/math-utils"
import type { SchematicTrace } from "circuit-json"
import { type Point, segmentIntersection } from "./segment-intersection"

type TraceGeometry = Pick<
  SchematicTrace,
  "edges" | "subcircuit_connectivity_map_key"
>
type SubcircuitConnectivityMapKey = NonNullable<
  SchematicTrace["subcircuit_connectivity_map_key"]
>

export type SchematicRoutingTerminal = {
  position: Point
  connectivityKey: SubcircuitConnectivityMapKey
}

type RoutingNode = {
  position: Point
  segments: RoutingSegment[]
  distanceToLabel: number
  pathToLabel?: { node: RoutingNode; segment: RoutingSegment }
}
type RoutingSegment = {
  from: RoutingNode
  to: RoutingNode
  cost: number
}

const GEOMETRY_TOLERANCE = 1e-6

/**
 * Retain paths from terminals to the nearest already-drawn net label. Solver
 * paths can end on other paths, so dropping a whole path by its pin IDs can
 * strand branches. Split the actual geometry at contacts before deciding which
 * wire is redundant. Existing wires and routes carrying inline net labels
 * cost zero and are never changed; terminals already attached to fixed labels
 * are the roots of the path search.
 *
 * All inputs belong to one schematic sheet, in circuit-world millimetres:
 * +X is right, +Y is up (right-handed). Positions are points, not directions.
 * Components with no path to an existing label retain their solver geometry.
 */
export function removeRedundantTracesToNetLabels<Trace extends TraceGeometry>({
  traces,
  existingTraces,
  netLabelTerminals,
  terminals,
  inlineNetLabelTraces = new Set<Trace>(),
}: {
  traces: Trace[]
  existingTraces: TraceGeometry[]
  netLabelTerminals: SchematicRoutingTerminal[]
  terminals: SchematicRoutingTerminal[]
  inlineNetLabelTraces?: ReadonlySet<Trace>
}): Trace[] {
  const retainedEdgesByOriginalEdge = new Map<
    SchematicTrace["edges"][number],
    SchematicTrace["edges"]
  >()

  for (const connectivityKey of new Set(
    netLabelTerminals.map((terminal) => terminal.connectivityKey),
  )) {
    const routingNodes: RoutingNode[] = []
    const getOrCreateRoutingNode = (position: Point) => {
      let node = routingNodes.find(
        (node) => distance(node.position, position) <= GEOMETRY_TOLERANCE,
      )
      if (!node) {
        node = { position, segments: [], distanceToLabel: Infinity }
        routingNodes.push(node)
      }
      return node
    }
    const netEdges = [
      ...existingTraces
        .filter(
          (trace) => trace.subcircuit_connectivity_map_key === connectivityKey,
        )
        .flatMap((trace) =>
          trace.edges.map((edge) => ({ edge, isPreserved: true })),
        ),
      ...traces
        .filter(
          (trace) => trace.subcircuit_connectivity_map_key === connectivityKey,
        )
        .flatMap((trace) =>
          trace.edges.map((edge) => ({
            edge,
            isPreserved: inlineNetLabelTraces.has(trace),
          })),
        ),
    ]
    for (const { edge } of netEdges) {
      getOrCreateRoutingNode(edge.from)
      getOrCreateRoutingNode(edge.to)
    }
    for (let edgeIndex = 0; edgeIndex < netEdges.length; edgeIndex++) {
      for (
        let otherEdgeIndex = edgeIndex + 1;
        otherEdgeIndex < netEdges.length;
        otherEdgeIndex++
      ) {
        const firstEdge = netEdges[edgeIndex]!.edge
        const secondEdge = netEdges[otherEdgeIndex]!.edge
        const contactPoint = segmentIntersection(
          firstEdge.from,
          firstEdge.to,
          secondEdge.from,
          secondEdge.to,
          GEOMETRY_TOLERANCE,
        )
        if (contactPoint) getOrCreateRoutingNode(contactPoint)
      }
    }
    const terminalNodes = terminals
      .filter((terminal) => terminal.connectivityKey === connectivityKey)
      .map((terminal) => getOrCreateRoutingNode(terminal.position))
    for (const terminal of netLabelTerminals) {
      if (terminal.connectivityKey === connectivityKey) {
        getOrCreateRoutingNode(terminal.position).distanceToLabel = 0
      }
    }

    const routingSegmentsByOriginalEdge = new Map<
      SchematicTrace["edges"][number],
      RoutingSegment[]
    >()
    for (const { edge, isPreserved } of netEdges) {
      const edgeNodes = routingNodes
        .filter(
          (node) =>
            pointToSegmentDistance(node.position, edge.from, edge.to) <=
            GEOMETRY_TOLERANCE,
        )
        .sort(
          (firstNode, secondNode) =>
            distance(edge.from, firstNode.position) -
            distance(edge.from, secondNode.position),
        )
      const segments: RoutingSegment[] = []
      for (let nodeIndex = 1; nodeIndex < edgeNodes.length; nodeIndex++) {
        const from = edgeNodes[nodeIndex - 1]!
        const to = edgeNodes[nodeIndex]!
        const segment = {
          from,
          to,
          cost: isPreserved ? 0 : distance(from.position, to.position),
        }
        from.segments.push(segment)
        to.segments.push(segment)
        segments.push(segment)
      }
      if (!isPreserved) routingSegmentsByOriginalEdge.set(edge, segments)
    }

    // Multi-source shortest paths let separate labels on the same net terminate
    // separate branches, while retaining shared rails needed by unlabeled pins.
    const unvisitedNodes = new Set(routingNodes)
    while (unvisitedNodes.size > 0) {
      let nearestNode: RoutingNode | undefined
      for (const node of unvisitedNodes) {
        if (node.distanceToLabel < (nearestNode?.distanceToLabel ?? Infinity)) {
          nearestNode = node
        }
      }
      if (!nearestNode) break
      unvisitedNodes.delete(nearestNode)
      for (const segment of nearestNode.segments) {
        const neighborNode =
          segment.from === nearestNode ? segment.to : segment.from
        const candidateDistance = nearestNode.distanceToLabel + segment.cost
        if (
          unvisitedNodes.has(neighborNode) &&
          candidateDistance < neighborNode.distanceToLabel
        ) {
          neighborNode.distanceToLabel = candidateDistance
          neighborNode.pathToLabel = { node: nearestNode, segment }
        }
      }
    }

    const retainedSegments = new Set<RoutingSegment>()
    for (let node of terminalNodes) {
      while (node.pathToLabel) {
        const { segment, node: nextNodeOnPath } = node.pathToLabel
        if (retainedSegments.has(segment)) break
        retainedSegments.add(segment)
        node = nextNodeOnPath
      }
    }
    for (const [edge, segments] of routingSegmentsByOriginalEdge) {
      const retainedEdgeSegments: SchematicTrace["edges"] = []
      for (const segment of segments) {
        if (
          !retainedSegments.has(segment) &&
          Number.isFinite(segment.from.distanceToLabel)
        )
          continue
        const previousRetainedEdge = retainedEdgeSegments.at(-1)
        if (
          previousRetainedEdge &&
          distance(previousRetainedEdge.to, segment.from.position) <=
            GEOMETRY_TOLERANCE
        ) {
          previousRetainedEdge.to = segment.to.position
        } else {
          retainedEdgeSegments.push({
            ...edge,
            from: segment.from.position,
            to: segment.to.position,
          })
        }
      }
      retainedEdgesByOriginalEdge.set(edge, retainedEdgeSegments)
    }
  }

  return traces
    .map((trace) => ({
      ...trace,
      edges: trace.edges.flatMap(
        (edge) => retainedEdgesByOriginalEdge.get(edge) ?? [edge],
      ),
    }))
    .filter((trace) => trace.edges.length > 0)
}
