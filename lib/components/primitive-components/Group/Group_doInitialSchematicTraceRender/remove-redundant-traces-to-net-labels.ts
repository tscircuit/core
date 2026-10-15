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

const TOL = 1e-6

/**
 * Retain paths from terminals to the nearest already-drawn net label. Solver
 * paths can end on other paths, so dropping a whole path by its pin IDs can
 * strand branches. Split the actual geometry at contacts before deciding which
 * wire is redundant. Existing wires and explicitly preserved routes cost zero
 * and are never changed; terminals already attached to fixed labels are the
 * roots of the path search.
 *
 * All inputs belong to one schematic sheet, in circuit-world millimetres:
 * +X is right, +Y is up (right-handed). Positions are points, not directions.
 * Components with no path to an existing label retain their solver geometry.
 */
export function removeRedundantTracesToNetLabels<T extends TraceGeometry>({
  traces,
  existingTraces,
  netLabelTerminals,
  terminals,
  tracesToPreserve = new Set<T>(),
}: {
  traces: T[]
  existingTraces: TraceGeometry[]
  netLabelTerminals: SchematicRoutingTerminal[]
  terminals: SchematicRoutingTerminal[]
  tracesToPreserve?: ReadonlySet<T>
}): T[] {
  const retainedEdges = new Map<
    SchematicTrace["edges"][number],
    SchematicTrace["edges"]
  >()

  for (const connectivityKey of new Set(
    netLabelTerminals.map((terminal) => terminal.connectivityKey),
  )) {
    const nodes: RoutingNode[] = []
    const getNode = (position: Point) => {
      let node = nodes.find((node) => distance(node.position, position) <= TOL)
      if (!node) {
        node = { position, segments: [], distanceToLabel: Infinity }
        nodes.push(node)
      }
      return node
    }
    const edges = [
      ...existingTraces
        .filter(
          (trace) => trace.subcircuit_connectivity_map_key === connectivityKey,
        )
        .flatMap((trace) =>
          trace.edges.map((edge) => ({ edge, existing: true })),
        ),
      ...traces
        .filter(
          (trace) => trace.subcircuit_connectivity_map_key === connectivityKey,
        )
        .flatMap((trace) =>
          trace.edges.map((edge) => ({
            edge,
            existing: tracesToPreserve.has(trace),
          })),
        ),
    ]
    for (const { edge } of edges) {
      getNode(edge.from)
      getNode(edge.to)
    }
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const a = edges[i]!.edge
        const b = edges[j]!.edge
        const contact = segmentIntersection(a.from, a.to, b.from, b.to, TOL)
        if (contact) getNode(contact)
      }
    }
    const terminalNodes = terminals
      .filter((terminal) => terminal.connectivityKey === connectivityKey)
      .map((terminal) => getNode(terminal.position))
    for (const terminal of netLabelTerminals) {
      if (terminal.connectivityKey === connectivityKey) {
        getNode(terminal.position).distanceToLabel = 0
      }
    }

    const segmentsByEdge = new Map<
      SchematicTrace["edges"][number],
      RoutingSegment[]
    >()
    for (const { edge, existing } of edges) {
      const edgeNodes = nodes
        .filter(
          (node) =>
            pointToSegmentDistance(node.position, edge.from, edge.to) <= TOL,
        )
        .sort(
          (a, b) =>
            distance(edge.from, a.position) - distance(edge.from, b.position),
        )
      const segments: RoutingSegment[] = []
      for (let i = 1; i < edgeNodes.length; i++) {
        const from = edgeNodes[i - 1]!
        const to = edgeNodes[i]!
        const segment = {
          from,
          to,
          cost: existing ? 0 : distance(from.position, to.position),
        }
        from.segments.push(segment)
        to.segments.push(segment)
        segments.push(segment)
      }
      if (!existing) segmentsByEdge.set(edge, segments)
    }

    // Multi-source shortest paths let separate labels on the same net terminate
    // separate branches, while retaining shared rails needed by unlabeled pins.
    const unvisited = new Set(nodes)
    while (unvisited.size > 0) {
      let nearest: RoutingNode | undefined
      for (const node of unvisited) {
        if (node.distanceToLabel < (nearest?.distanceToLabel ?? Infinity)) {
          nearest = node
        }
      }
      if (!nearest) break
      unvisited.delete(nearest)
      for (const segment of nearest.segments) {
        const neighbor = segment.from === nearest ? segment.to : segment.from
        const candidateDistance = nearest.distanceToLabel + segment.cost
        if (
          unvisited.has(neighbor) &&
          candidateDistance < neighbor.distanceToLabel
        ) {
          neighbor.distanceToLabel = candidateDistance
          neighbor.pathToLabel = { node: nearest, segment }
        }
      }
    }

    const retainedSegments = new Set<RoutingSegment>()
    for (let node of terminalNodes) {
      while (node.pathToLabel) {
        const { segment, node: next } = node.pathToLabel
        if (retainedSegments.has(segment)) break
        retainedSegments.add(segment)
        node = next
      }
    }
    for (const [edge, segments] of segmentsByEdge) {
      const kept: SchematicTrace["edges"] = []
      for (const segment of segments) {
        if (
          !retainedSegments.has(segment) &&
          Number.isFinite(segment.from.distanceToLabel)
        )
          continue
        const previous = kept.at(-1)
        if (previous && distance(previous.to, segment.from.position) <= TOL) {
          previous.to = segment.to.position
        } else {
          kept.push({
            ...edge,
            from: segment.from.position,
            to: segment.to.position,
          })
        }
      }
      retainedEdges.set(edge, kept)
    }
  }

  return traces
    .map((trace) => ({
      ...trace,
      edges: trace.edges.flatMap((edge) => retainedEdges.get(edge) ?? [edge]),
    }))
    .filter((trace) => trace.edges.length > 0)
}
