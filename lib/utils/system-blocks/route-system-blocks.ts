import type { Point } from "circuit-json"
import { measureSystemRouteQuality } from "./measure-system-route-quality"
import type { SystemBlockTree } from "./collect-system-blocks"
import type { SystemBlockComponent } from "lib/components/primitive-components/SystemBlockComponent"
import type { SystemBlockGroup } from "lib/components/primitive-components/SystemBlockGroup"
import type { SystemBlockConnection } from "lib/components/primitive-components/SystemBlockConnection"
import {
  findSystemOrthogonalPath,
  type SystemRoutingObstacle,
} from "./find-system-orthogonal-path"

/** Page-centered diagram mm: +X right, +Y up. Centers and route vertices are points. */
export interface SystemBlockBounds {
  center: Point
  width: number
  height: number
}

export interface SystemConnectionRoute {
  route: Point[]
  label_anchor_center?: Point
}

type Port = {
  point: Point
  escape: Point
  side: number
  target: Point
  connection: SystemBlockConnection
}

/** Conservative horizontal label width in diagram mm, including a text halo. */
export function getSystemConnectionLabelWidth(label: string): number {
  // Approximate the renderer's 2.5 mm sans-serif glyphs, reserving extra space
  // for wide capitals and non-ASCII glyphs instead of assuming uniform widths.
  let width = 3
  for (const character of label) {
    width += /[MW@%#&]|[^\x00-\x7f]/.test(character)
      ? 2.5
      : /[A-Z0-9]/.test(character)
        ? 1.85
        : /[il.,:;!| ']/.test(character)
          ? 0.85
          : 1.5
  }
  return width
}

/**
 * Route on a rectilinear visibility grid around blocks, group headings and labels.
 * Dagre supplies ranks and label slots, but not the final wire geometry. Ports
 * start in approach-angle order, then swap slots when rerouting improves the
 * complete diagram. Distinct slots prevent a shared fanout tip.
 * All input/output geometry is page-centered diagram mm (+X right, +Y up).
 */
export function routeSystemBlocks(
  tree: SystemBlockTree,
  bounds: Map<SystemBlockComponent | SystemBlockGroup, SystemBlockBounds>,
  initialRoutes: Map<SystemBlockConnection, SystemConnectionRoute>,
): Map<SystemBlockConnection, SystemConnectionRoute> {
  const obstacles: SystemRoutingObstacle[] = [...bounds].map(
    ([block, box]) => ({
      left: box.center.x - box.width / 2 - 2,
      right: tree.groups.includes(block as SystemBlockGroup)
        ? box.center.x -
          box.width / 2 +
          Math.min(
            box.width,
            block._parsedProps.description
              ? box.width
              : (block._parsedProps.displayName ?? block.name).length * 1.8 + 6,
          )
        : box.center.x + box.width / 2 + 2,
      bottom: tree.groups.includes(block as SystemBlockGroup)
        ? box.center.y +
          box.height / 2 -
          (block._parsedProps.description ? 12 : 7)
        : box.center.y - box.height / 2 - 2,
      top: box.center.y + box.height / 2 + 2,
    }),
  )
  const portsByBlock = new Map<SystemBlockComponent, Port[]>()
  const portsByConnection = new Map<SystemBlockConnection, Port[]>()
  for (const connection of tree.connections) {
    const endpoints = tree.endpoints.get(connection)!
    const route = initialRoutes.get(connection)!.route
    const ports = [endpoints.from, endpoints.to].map((block, end) => {
      const box = bounds.get(block)!
      const target = bounds.get(
        end === 0 ? endpoints.to : endpoints.from,
      )!.center
      const guide = initialRoutes.get(connection)!.label_anchor_center ?? target
      const point =
        endpoints.from === endpoints.to
          ? end === 0
            ? route[0]
            : route.at(-1)!
          : guide
      const dx = (point.x - box.center.x) / box.width
      const dy = (point.y - box.center.y) / box.height
      const side =
        Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 0 : 2) : dy >= 0 ? 1 : 3
      const port = {
        point: { ...point },
        escape: { ...point },
        side,
        target: guide,
        connection,
      }
      const ports = portsByBlock.get(block) ?? []
      ports.push(port)
      portsByBlock.set(block, ports)
      return port
    })
    portsByConnection.set(connection, ports)
  }
  for (const [block, ports] of portsByBlock) {
    const box = bounds.get(block)!
    for (const side of [0, 1, 2, 3]) {
      const horizontal = side % 2 === 0
      const facePorts = ports
        .filter((p) => p.side === side)
        .sort((a, b) =>
          horizontal
            ? (a.target.y - box.center.y) /
                Math.max(1, Math.abs(a.target.x - box.center.x)) -
              (b.target.y - box.center.y) /
                Math.max(1, Math.abs(b.target.x - box.center.x))
            : (a.target.x - box.center.x) /
                Math.max(1, Math.abs(a.target.y - box.center.y)) -
              (b.target.x - box.center.x) /
                Math.max(1, Math.abs(b.target.y - box.center.y)),
        )
      const span = horizontal ? box.height : box.width
      const spacing = Math.min(
        4,
        (span - 4) / Math.max(1, facePorts.length - 1),
      )
      facePorts.forEach((port, index) => {
        const offset = (index - (facePorts.length - 1) / 2) * spacing
        const sign = side < 2 ? 1 : -1
        port.point = horizontal
          ? {
              x: box.center.x + (sign * box.width) / 2,
              y: box.center.y + offset,
            }
          : {
              x: box.center.x + offset,
              y: box.center.y + (sign * box.height) / 2,
            }
        port.escape = horizontal
          ? { x: port.point.x + sign * 4, y: port.point.y }
          : { x: port.point.x, y: port.point.y + sign * 4 }
      })
    }
  }
  const labels = new Map<SystemBlockConnection, SystemRoutingObstacle>()
  const labelCenters = new Map<SystemBlockConnection, Point>()
  const portObstacles = [...portsByConnection.values()]
    .flat()
    .map(({ escape }) => ({
      left: escape.x - 1,
      right: escape.x + 1,
      bottom: escape.y - 1,
      top: escape.y + 1,
    }))
  for (const connection of tree.connections) {
    const label = connection._parsedProps.label
    const center = initialRoutes.get(connection)!.label_anchor_center
    if (label !== undefined && center) {
      const halfWidth = getSystemConnectionLabelWidth(label) / 2
      // A cross-subsystem label may coincide with an internal label. Search
      // nearby slots explicitly before reserving the label as a routing obstacle.
      const occupied = [...obstacles, ...labels.values(), ...portObstacles]
      let placed = false
      for (let radius = 0; !placed; radius++) {
        const offsets =
          radius === 0
            ? [[0, 0]]
            : [
                [0, radius * 6],
                [0, -radius * 6],
                [radius * 6, 0],
                [-radius * 6, 0],
              ]
        for (const [dx, dy] of offsets) {
          const candidate = { x: center.x + dx, y: center.y + dy }
          const rectangle = {
            left: candidate.x - halfWidth,
            right: candidate.x + halfWidth,
            bottom: candidate.y - 2.5,
            top: candidate.y + 2.5,
          }
          if (
            occupied.some(
              (r) =>
                rectangle.left < r.right + 1 &&
                rectangle.right > r.left - 1 &&
                rectangle.bottom < r.top + 1 &&
                rectangle.top > r.bottom - 1,
            )
          )
            continue
          labels.set(connection, rectangle)
          labelCenters.set(connection, candidate)
          placed = true
          break
        }
      }
    }
  }
  const routeConnection = (
    connection: SystemBlockConnection,
    routedSegments: [Point, Point][],
  ): SystemConnectionRoute => {
    const [start, end] = portsByConnection.get(connection)!
    const label = labels.get(connection)
    const blocked = [
      ...obstacles,
      ...[...labels].filter(([c]) => c !== connection).map(([, r]) => r),
    ]
    const waypoints = [start.escape]
    if (label) {
      const y = labelCenters.get(connection)!.y
      const labelPorts = [
        { x: label.left, y },
        { x: label.right, y },
      ]
      if (start.escape.x > end.escape.x) labelPorts.reverse()
      waypoints.push(...labelPorts)
    }
    waypoints.push(end.escape)
    const route = [start.point]
    for (let i = 1; i < waypoints.length; i++) {
      // Enter and leave a label at opposite ends. Keeping its interior blocked
      // on the other legs avoids backtracking beneath the same text or self-loop.
      const legObstacles = label && i !== 2 ? [...blocked, label] : blocked
      const leg = findSystemOrthogonalPath(
        waypoints[i - 1],
        waypoints[i],
        legObstacles,
        routedSegments,
      )
      if (!leg) {
        throw new Error(
          `Cannot route system connection from "${connection._parsedProps.from}" to "${connection._parsedProps.to}" around blocks and labels`,
        )
      }
      route.push(...leg)
    }
    route.push(end.point)
    const simplified: Point[] = []
    for (const point of route) {
      const previous = simplified.at(-1)
      if (previous?.x === point.x && previous.y === point.y) continue
      const before = simplified.at(-2)
      if (
        before &&
        previous &&
        ((before.x === previous.x && previous.x === point.x) ||
          (before.y === previous.y && previous.y === point.y))
      )
        simplified.pop()
      simplified.push(point)
    }
    return {
      route: simplified,
      label_anchor_center: labelCenters.get(connection),
    }
  }
  const connections = [...tree.connections].sort((a, b) => {
    const distance = (connection: SystemBlockConnection) => {
      const [from, to] = portsByConnection.get(connection)!
      return (
        Math.abs(from.point.x - to.point.x) +
        Math.abs(from.point.y - to.point.y)
      )
    }
    return (
      distance(a) - distance(b) ||
      a._parsedProps.from.localeCompare(b._parsedProps.from) ||
      a._parsedProps.to.localeCompare(b._parsedProps.to) ||
      (a._parsedProps.label ?? "").localeCompare(b._parsedProps.label ?? "")
    )
  })
  const segmentsOf = (
    resolvedRoutes: Iterable<SystemConnectionRoute>,
  ): [Point, Point][] =>
    [...resolvedRoutes].flatMap(({ route }) =>
      route
        .slice(1)
        .map((point, index): [Point, Point] => [route[index], point]),
    )
  let routes = new Map<SystemBlockConnection, SystemConnectionRoute>()
  for (const connection of connections)
    routes.set(
      connection,
      routeConnection(connection, segmentsOf(routes.values())),
    )
  let score = measureSystemRouteQuality(
    [...routes.values()].map((r) => r.route),
  ).score
  // Evaluate complete emitted polylines, not just distance to the other block.
  // A swap keeps the available slots fixed and reroutes both incident wires.
  // Across a corner it also changes the selected face without crowding new ports
  // into an occupied interval. Accept only improvements to the whole diagram.
  const reroute = (affected: Set<SystemBlockConnection>) => {
    const candidate = new Map(
      [...routes].filter(([connection]) => !affected.has(connection)),
    )
    for (const connection of connections.filter((c) => affected.has(c)))
      candidate.set(
        connection,
        routeConnection(connection, segmentsOf(candidate.values())),
      )
    const candidateScore = measureSystemRouteQuality(
      [...candidate.values()].map((r) => r.route),
    ).score
    if (candidateScore >= score - 1e-6) return false
    routes = candidate
    score = candidateScore
    return true
  }
  let proposals = 0
  const proposalLimit = Math.min(64, connections.length * 4)
  for (let pass = 0; pass < 4 && proposals < proposalLimit; pass++) {
    let improved = false
    for (const [block, ports] of portsByBlock) {
      if (ports.length < 2) continue
      const center = bounds.get(block)!.center
      const perimeter = [...ports].sort(
        (a, b) =>
          Math.atan2(a.point.y - center.y, a.point.x - center.x) -
          Math.atan2(b.point.y - center.y, b.point.x - center.x),
      )
      for (let i = 0; i < perimeter.length && proposals < proposalLimit; i++) {
        proposals++
        const a = perimeter[i],
          b = perimeter[(i + 1) % perimeter.length]
        const swap = () => {
          ;[a.point, b.point] = [b.point, a.point]
          ;[a.escape, b.escape] = [b.escape, a.escape]
          ;[a.side, b.side] = [b.side, a.side]
        }
        swap()
        if (reroute(new Set([a.connection, b.connection]))) {
          improved = true
          // Keep the scan in geometric slot order after moving the occupants.
          perimeter[i] = b
          perimeter[(i + 1) % perimeter.length] = a
        } else swap()
      }
    }
    if (!improved) break
    const quality = measureSystemRouteQuality(
      [...routes.values()].map((r) => r.route),
    )
    if (
      quality.crossings === 0 &&
      quality.sharedLength === 0 &&
      quality.closeParallelLength === 0
    )
      break
  }
  // One cleanup sweep can shorten detours left by an earlier route without
  // reopening the bounded search over endpoint permutations.
  for (const connection of connections) reroute(new Set([connection]))
  return routes
}
