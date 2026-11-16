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
import { placeSystemConnectionLabel } from "./place-system-connection-label"

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
  /** Center of the block at the wire's other end; undefined for a self-loop. */
  other?: Point
  connection: SystemBlockConnection
  block: SystemBlockComponent
}

/** Whether a block face (0 right, 1 top, 2 left, 3 bottom) looks away from a point. */
const facesAway = (side: number, center: Point, point: Point) =>
  [
    point.x - center.x,
    point.y - center.y,
    center.x - point.x,
    center.y - point.y,
  ][side] < 0

/** Length of the straight stub between a block face and its first bend, in mm. */
const PORT_STUB_LENGTH = 6

/** Total horizontal padding around connection text, in diagram mm. */
export const SYSTEM_CONNECTION_LABEL_HORIZONTAL_PADDING = 3

/** Conservative horizontal label width in diagram mm, including a text halo. */
export function getSystemConnectionLabelWidth(label: string): number {
  // Approximate the renderer's 2.5 mm sans-serif glyphs, reserving extra space
  // for wide capitals and non-ASCII glyphs instead of assuming uniform widths.
  let width = SYSTEM_CONNECTION_LABEL_HORIZONTAL_PADDING
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
 * Route on a rectilinear visibility grid around blocks and group headings.
 * Dagre supplies ranks and approach directions, but not the final wire geometry.
 * Ports start in approach-angle order, then swap slots when rerouting improves
 * the complete diagram. Distinct slots prevent a shared fanout tip. A wire is
 * never bent to reach its text: labels are placed on the finished wires.
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
          ) +
          2
        : box.center.x + box.width / 2 + 2,
      // Like a block, a heading keeps 2 mm clear on every side, so a wire
      // that turns around it has room for a fillet.
      bottom: tree.groups.includes(block as SystemBlockGroup)
        ? box.center.y +
          box.height / 2 -
          (block._parsedProps.description ? 12 : 7) -
          2
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
      const selfLoop = endpoints.from === endpoints.to
      const guide = initialRoutes.get(connection)!.label_anchor_center ?? target
      const sideFacing = (point: Point) => {
        const dx = (point.x - box.center.x) / box.width
        const dy = (point.y - box.center.y) / box.height
        return Math.abs(dx) >= Math.abs(dy)
          ? dx >= 0
            ? 0
            : 2
          : dy >= 0
            ? 1
            : 3
      }
      const point = selfLoop ? (end === 0 ? route[0] : route.at(-1)!) : guide
      let side = sideFacing(point)
      // Dagre's label slot hints at the lane a wire should take, but it can lie
      // behind the block. Never start a wire on a face that looks away from
      // the block it connects to: it would have to hook around its own block.
      if (!selfLoop && facesAway(side, box.center, target))
        side = sideFacing(target)
      const port = {
        point: { ...point },
        escape: { ...point },
        side,
        target: guide,
        other: selfLoop ? undefined : target,
        connection,
        block,
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
      // Spread slots while the face has room: wider gaps let an attachment
      // slide into line with the block it connects to.
      const spacing = Math.min(
        6,
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
          ? { x: port.point.x + sign * PORT_STUB_LENGTH, y: port.point.y }
          : { x: port.point.x, y: port.point.y + sign * PORT_STUB_LENGTH }
      })
    }
  }
  const labels = new Map<SystemBlockConnection, SystemRoutingObstacle>()
  const labelCenters = new Map<SystemBlockConnection, Point>()
  const labelAttachments = new Map<SystemBlockConnection, Point>()
  const portObstacles = [...portsByConnection.values()]
    .flat()
    .map(({ escape, connection }) => ({
      connection,
      left: escape.x - 1,
      right: escape.x + 1,
      bottom: escape.y - 1,
      top: escape.y + 1,
    }))
  for (const connection of tree.connections) {
    const label = connection._parsedProps.label
    const center = initialRoutes.get(connection)!.label_anchor_center
    const endpoints = tree.endpoints.get(connection)!
    // Only a self-loop reserves its text before routing: its shape is built
    // around the label. Every other label is placed on its finished wire.
    if (label === undefined || !center || endpoints.from !== endpoints.to)
      continue
    const halfWidth = getSystemConnectionLabelWidth(label) / 2
    const [start, end] = portsByConnection.get(connection)!
    const occupied = [...obstacles, ...labels.values(), ...portObstacles]
    const fits = (rectangle: SystemRoutingObstacle, besideOwnLoop = false) =>
      !occupied.some((r) => {
        if (besideOwnLoop && "connection" in r && r.connection === connection)
          return false
        // Neighboring ports already reserve 1 mm around their escape points.
        // A compact loop label can use that clearance without doubling it.
        const margin = besideOwnLoop && "connection" in r ? 0 : 1
        return (
          rectangle.left < r.right + margin &&
          rectangle.right > r.left - margin &&
          rectangle.bottom < r.top + margin &&
          rectangle.top > r.bottom - margin
        )
      })
    const vertical = start.escape.x === end.escape.x
    // A same-face return already has a simple backbone. Put text beside it
    // instead of inserting a horizontal span into the wire. Keep a single
    // attachment waypoint so later port swaps cannot orphan text.
    if (
      start.side === end.side &&
      !obstacles.some((r) =>
        vertical
          ? start.escape.x > r.left &&
            start.escape.x < r.right &&
            Math.max(start.escape.y, end.escape.y) > r.bottom &&
            Math.min(start.escape.y, end.escape.y) < r.top
          : start.escape.y > r.bottom &&
            start.escape.y < r.top &&
            Math.max(start.escape.x, end.escape.x) > r.left &&
            Math.min(start.escape.x, end.escape.x) < r.right,
      )
    ) {
      const attachment = {
        x: (start.escape.x + end.escape.x) / 2,
        y: (start.escape.y + end.escape.y) / 2,
      }
      // The label lies outside the loop's return. Its text halo already
      // supplies horizontal clearance; do not add the loop's own port
      // keepouts on top of that padding.
      const sign = start.side < 2 ? 1 : -1
      const candidate = vertical
        ? { x: attachment.x + sign * halfWidth, y: attachment.y }
        : { x: attachment.x, y: attachment.y + sign * 3.5 }
      const rectangle = {
        left: candidate.x - halfWidth,
        right: candidate.x + halfWidth,
        bottom: candidate.y - 2.5,
        top: candidate.y + 2.5,
      }
      if (fits(rectangle, true)) {
        labels.set(connection, rectangle)
        labelCenters.set(connection, candidate)
        labelAttachments.set(connection, attachment)
        continue
      }
    }
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
        if (!fits(rectangle)) continue
        labels.set(connection, rectangle)
        labelCenters.set(connection, candidate)
        placed = true
        break
      }
    }
  }
  const segmentsOf = (
    resolvedRoutes: Iterable<SystemConnectionRoute>,
  ): [Point, Point][] =>
    [...resolvedRoutes].flatMap(({ route }) =>
      route
        .slice(1)
        .map((point, index): [Point, Point] => [route[index], point]),
    )
  const simplify = (route: Point[]): Point[] => {
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
    return simplified
  }
  /**
   * Slide an attachment along its block face when that removes the jog between
   * the port stub and the wire's next run. Slots only fix the order of ports on
   * a face, so a misaligned slot should not put a kink into a straight wire.
   */
  const alignPorts = (
    connection: SystemBlockConnection,
    initial: Point[],
    routed: Map<SystemBlockConnection, SystemConnectionRoute>,
    blocked: SystemRoutingObstacle[],
  ): Point[] => {
    const ports = portsByConnection.get(connection)!
    const others = [...routed.values()].map((r) => r.route)
    /** Whether a port may attach at this coordinate along its block face. */
    const canAttach = (owner: Port, across: "x" | "y", coordinate: number) => {
      const box = bounds.get(owner.block)!
      const span = across === "y" ? box.height : box.width
      if (Math.abs(coordinate - box.center[across]) > span / 2 - 2 + 1e-6)
        return false
      // Keep the routing clearance to every other attachment on this face,
      // whether its wire has been routed (and possibly slid) or not, and never
      // pass one: the order of the slots is what keeps their wires uncrossed.
      return !portsByBlock.get(owner.block)!.some((other) => {
        if (other === owner || other.side !== owner.side) return false
        const otherRoute = routed.get(other.connection)?.route
        const point = !otherRoute
          ? other.point
          : portsByConnection.get(other.connection)![0] === other
            ? otherRoute[0]
            : otherRoute.at(-1)!
        return (
          Math.abs(point[across] - coordinate) < 3 - 1e-6 ||
          Math.sign(point[across] - coordinate) !==
            Math.sign(point[across] - owner.point[across])
        )
      })
    }
    /** Accept a straightened route unless it runs into something new. */
    const isImprovement = (current: Point[], candidate: Point[]) => {
      // Both attachment stubs lie inside their own blocks' routing margins.
      const inner = candidate.map((point, index) => {
        const neighbor =
          index === 0
            ? candidate[1]
            : index === candidate.length - 1
              ? candidate[index - 1]
              : undefined
        return neighbor
          ? {
              x: point.x + Math.sign(neighbor.x - point.x) * PORT_STUB_LENGTH,
              y: point.y + Math.sign(neighbor.y - point.y) * PORT_STUB_LENGTH,
            }
          : point
      })
      for (let index = 1; index < inner.length; index++) {
        const from = inner[index - 1]
        const to = inner[index]
        if (
          blocked.some(
            (r) =>
              Math.min(from.x, to.x) < r.right - 1e-6 &&
              Math.max(from.x, to.x) > r.left + 1e-6 &&
              Math.min(from.y, to.y) < r.top - 1e-6 &&
              Math.max(from.y, to.y) > r.bottom + 1e-6,
          )
        )
          return false
      }
      const before = measureSystemRouteQuality([...others, current])
      const after = measureSystemRouteQuality([...others, candidate])
      return (
        after.crossings <= before.crossings &&
        after.sharedLength <= before.sharedLength + 1e-6 &&
        after.closeParallelLength <= before.closeParallelLength + 1e-6
      )
    }
    let route = initial
    for (const end of [1, 0]) {
      if (route.length < 4) break
      const oriented = end === 0 ? route : [...route].reverse()
      const [port, elbow, jogEnd, next] = oriented
      const axis = port.x === elbow.x ? "y" : "x"
      const across = axis === "x" ? "y" : "x"
      // A Z-shaped jog continues in the stub's direction; a U-turn does not.
      if (
        Math.sign(elbow[axis] - port[axis]) !==
        Math.sign(next[axis] - jogEnd[axis])
      )
        continue
      const slide = (coordinate: number): Point[] | undefined => {
        if (!canAttach(ports[end], across, coordinate)) return
        const moved = { ...port, [across]: coordinate } as Point
        if (coordinate === jogEnd[across]) return [moved, ...oriented.slice(3)]
        // Two facing blocks: move both attachments onto one shared line.
        if (
          oriented.length !== 4 ||
          !canAttach(ports[1 - end], across, coordinate)
        )
          return
        return [moved, { ...next, [across]: coordinate } as Point]
      }
      // Prefer moving one attachment; otherwise meet between the two slots.
      const jog = jogEnd[across] - port[across]
      const partial: number[] = []
      for (let step = 1; oriented.length === 4 && step < Math.abs(jog); step++)
        partial.push(Math.sign(jog) * step)
      partial.sort((a, b) => Math.abs(a - jog / 2) - Math.abs(b - jog / 2))
      for (const offset of [jog, ...partial]) {
        const candidate = slide(port[across] + offset)
        if (!candidate || !isImprovement(oriented, candidate)) continue
        route = end === 0 ? candidate : candidate.reverse()
        break
      }
    }
    return route
  }
  const routeConnection = (
    connection: SystemBlockConnection,
    routed: Map<SystemBlockConnection, SystemConnectionRoute>,
  ): SystemConnectionRoute => {
    const [start, end] = portsByConnection.get(connection)!
    const routedSegments = segmentsOf(routed.values())
    const label = labels.get(connection)
    const attachment = labelAttachments.get(connection)
    const blocked = [
      ...obstacles,
      ...[...labels].filter(([c]) => c !== connection).map(([, r]) => r),
    ]
    // A wire leaves its block through a full stub, which leaves room for the
    // first fillet and the arrowhead. It should not turn back into the strip
    // between the face and the escape line.
    const stubStrips = (start.block === end.block ? [] : [start, end]).map(
      (port) => {
        const box = bounds.get(port.block)!
        return port.side % 2 === 0
          ? {
              left: Math.min(port.point.x, port.escape.x),
              right: Math.max(port.point.x, port.escape.x),
              bottom: box.center.y - box.height / 2 - 2,
              top: box.center.y + box.height / 2 + 2,
            }
          : {
              left: box.center.x - box.width / 2 - 2,
              right: box.center.x + box.width / 2 + 2,
              bottom: Math.min(port.point.y, port.escape.y),
              top: Math.max(port.point.y, port.escape.y),
            }
      },
    )
    const waypoints = [start.escape]
    if (attachment) {
      waypoints.push(attachment)
    } else if (label) {
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
      const legObstacles =
        label && (attachment || i !== 2) ? [...blocked, label] : blocked
      const headings = {
        start: i === 1 ? (["x", "y"] as const)[start.side % 2] : undefined,
        end:
          i === waypoints.length - 1
            ? (["x", "y"] as const)[end.side % 2]
            : undefined,
      }
      // Blocks packed closer than two stubs leave no way around the strips.
      const leg =
        findSystemOrthogonalPath(
          waypoints[i - 1],
          waypoints[i],
          [...legObstacles, ...stubStrips],
          routedSegments,
          headings,
        ) ??
        findSystemOrthogonalPath(
          waypoints[i - 1],
          waypoints[i],
          legObstacles,
          routedSegments,
          headings,
        )
      if (!leg) {
        throw new Error(
          `Cannot route system connection from "${connection._parsedProps.from}" to "${connection._parsedProps.to}" around blocks and labels`,
        )
      }
      route.push(...leg)
    }
    route.push(end.point)
    const simplified = simplify(route)
    return {
      route:
        start.block === end.block
          ? simplified
          : alignPorts(connection, simplified, routed, blocked),
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
  let routes = new Map<SystemBlockConnection, SystemConnectionRoute>()
  for (const connection of connections)
    routes.set(connection, routeConnection(connection, routes))
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
      candidate.set(connection, routeConnection(connection, candidate))
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
        // A swap across a corner must not turn a port away from its wire's
        // other end; the wire would have to hook around its own block.
        if (
          [a, b].some(
            (port) => port.other && facesAway(port.side, center, port.other),
          )
        ) {
          swap()
          continue
        }
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
  // Wires are final. Give each remaining label a clear slot near its wire,
  // shortest wires first because they have the fewest slots to choose from.
  const placedLabels = [...labels.values()]
  for (const connection of connections) {
    const label = connection._parsedProps.label
    const resolved = routes.get(connection)!
    if (label === undefined || resolved.label_anchor_center) continue
    const width = getSystemConnectionLabelWidth(label)
    const center = placeSystemConnectionLabel({
      route: resolved.route,
      width,
      obstacles,
      labels: placedLabels,
      otherRoutes: [...routes]
        .filter(([other]) => other !== connection)
        .map(([, r]) => r.route),
    })
    placedLabels.push({
      left: center.x - width / 2,
      right: center.x + width / 2,
      bottom: center.y - 2.5,
      top: center.y + 2.5,
    })
    resolved.label_anchor_center = center
  }
  return routes
}
