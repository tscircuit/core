import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"

type Point = { readonly x: number; readonly y: number }

export interface BusChannelAssignment {
  readonly busId: string
  readonly selectedLayer: string
  readonly connectionNamesInWindingOrder: readonly string[]
}

export interface BusChannelPlan {
  readonly assignments: readonly BusChannelAssignment[]
  readonly orderedConnectionNames: readonly string[]
}

const EPSILON = 1e-9

const getChannelFrame = (input: SimpleRouteJson) => {
  const deltas = input.connections.map((connection) => {
    const [first, second] = connection.pointsToConnect
    return {
      x: Math.abs((second?.x ?? 0) - (first?.x ?? 0)),
      y: Math.abs((second?.y ?? 0) - (first?.y ?? 0)),
    }
  })
  const horizontal =
    deltas.reduce((sum, delta) => sum + delta.x, 0) >=
    deltas.reduce((sum, delta) => sum + delta.y, 0)
  return {
    normal: horizontal ? ({ x: 1, y: 0 } as const) : ({ x: 0, y: 1 } as const),
    tangent: horizontal ? ({ x: 0, y: 1 } as const) : ({ x: 1, y: 0 } as const),
  }
}

const project = (point: Point, vector: Point): number =>
  point.x * vector.x + point.y * vector.y

const getOrderedTerminalPair = (
  connection: SimpleRouteJson["connections"][number],
  normal: Point,
) => {
  if (connection.pointsToConnect.length !== 2) {
    throw new Error(
      `Bus channel connection "${connection.name}" must have exactly two terminals`,
    )
  }
  return [...connection.pointsToConnect].sort(
    (first, second) =>
      project(first, normal) - project(second, normal) ||
      project(first, { x: -normal.y, y: normal.x }) -
        project(second, { x: -normal.y, y: normal.x }),
  ) as [
    SimpleRouteJson["connections"][number]["pointsToConnect"][number],
    SimpleRouteJson["connections"][number]["pointsToConnect"][number],
  ]
}

export const buildBusChannelPlan = (input: SimpleRouteJson): BusChannelPlan => {
  const connectionByName = new Map(
    input.connections.map((connection) => [connection.name, connection]),
  )
  const { normal, tangent } = getChannelFrame(input)
  const assignments: BusChannelAssignment[] = []

  for (const bus of [...(input.buses ?? [])].sort((first, second) =>
    first.busId.localeCompare(second.busId),
  )) {
    if (bus.termination?.type === "plane") continue
    const connections = bus.connectionNames
      .map((connectionName) => connectionByName.get(connectionName))
      .filter((connection): connection is NonNullable<typeof connection> =>
        Boolean(connection),
      )
    if (connections.length === 0) continue

    const selectedLayers = new Set<string>()
    const terminalPairs = new Map<string, ReturnType<typeof getOrderedTerminalPair>>()
    for (const connection of connections) {
      const terminalLayers = new Set(
        connection.pointsToConnect.map((point) => point.layer),
      )
      if (terminalLayers.size !== 1) {
        throw new Error(
          `Bus channel connection "${connection.name}" has mismatched terminal layers`,
        )
      }
      selectedLayers.add([...terminalLayers][0]!)
      terminalPairs.set(
        connection.name,
        getOrderedTerminalPair(connection, normal),
      )
    }
    if (selectedLayers.size !== 1) {
      throw new Error(
        `Bus channel "${bus.busId}" must use one layer, received ${[
          ...selectedLayers,
        ].join(", ")}`,
      )
    }
    const selectedLayer = [...selectedLayers][0]!
    if (bus.preferredLayer && bus.preferredLayer !== selectedLayer) {
      throw new Error(
        `Bus channel "${bus.busId}" layer "${selectedLayer}" overrides selected layer "${bus.preferredLayer}"`,
      )
    }

    const orderAt = (terminalIndex: 0 | 1) =>
      [...connections]
        .sort(
          (first, second) =>
            project(terminalPairs.get(first.name)![terminalIndex], tangent) -
              project(terminalPairs.get(second.name)![terminalIndex], tangent) ||
            first.name.localeCompare(second.name),
        )
        .map((connection) => connection.name)
    const sourceOrder = orderAt(0)
    const destinationOrder = orderAt(1)
    if (
      sourceOrder.some(
        (connectionName, index) => connectionName !== destinationOrder[index],
      )
    ) {
      throw new Error(
        `Bus channel "${bus.busId}" reverses winding between package breakouts`,
      )
    }
    assignments.push(
      Object.freeze({
        busId: bus.busId,
        selectedLayer,
        connectionNamesInWindingOrder: Object.freeze(sourceOrder),
      }),
    )
  }

  const rankByConnectionName = new Map<string, number>()
  for (const assignment of assignments) {
    assignment.connectionNamesInWindingOrder.forEach((name, rank) =>
      rankByConnectionName.set(name, rank),
    )
  }
  const layerByBusId = new Map(
    assignments.map((assignment) => [assignment.busId, assignment.selectedLayer]),
  )
  const busIdByConnectionName = new Map(
    (input.buses ?? []).flatMap((bus) =>
      bus.connectionNames.map((name) => [name, bus.busId] as const),
    ),
  )
  const orderedConnectionNames = [...connectionByName.keys()].sort(
    (first, second) => {
      const firstBusId = busIdByConnectionName.get(first) ?? `ungrouped:${first}`
      const secondBusId = busIdByConnectionName.get(second) ?? `ungrouped:${second}`
      const firstTangent = project(
        getOrderedTerminalPair(connectionByName.get(first)!, normal)[0],
        tangent,
      )
      const secondTangent = project(
        getOrderedTerminalPair(connectionByName.get(second)!, normal)[0],
        tangent,
      )
      return (
        (layerByBusId.get(firstBusId) ?? "top").localeCompare(
          layerByBusId.get(secondBusId) ?? "top",
        ) ||
        firstTangent - secondTangent ||
        firstBusId.localeCompare(secondBusId) ||
        (rankByConnectionName.get(first) ?? 0) -
          (rankByConnectionName.get(second) ?? 0) ||
        first.localeCompare(second)
      )
    },
  )

  return Object.freeze({
    assignments: Object.freeze(assignments),
    orderedConnectionNames: Object.freeze(orderedConnectionNames),
  })
}

const cross = (first: Point, second: Point, third: Point): number =>
  (second.x - first.x) * (third.y - first.y) -
  (second.y - first.y) * (third.x - first.x)

const isBetween = (value: number, first: number, second: number): boolean =>
  value + EPSILON >= Math.min(first, second) &&
  value - EPSILON <= Math.max(first, second)

const pointOnSegment = (point: Point, first: Point, second: Point): boolean =>
  Math.abs(cross(first, second, point)) <= EPSILON &&
  isBetween(point.x, first.x, second.x) &&
  isBetween(point.y, first.y, second.y)

const segmentsIntersect = (
  firstStart: Point,
  firstEnd: Point,
  secondStart: Point,
  secondEnd: Point,
): boolean => {
  const firstSide = cross(firstStart, firstEnd, secondStart)
  const secondSide = cross(firstStart, firstEnd, secondEnd)
  const thirdSide = cross(secondStart, secondEnd, firstStart)
  const fourthSide = cross(secondStart, secondEnd, firstEnd)
  if (
    ((firstSide > EPSILON && secondSide < -EPSILON) ||
      (firstSide < -EPSILON && secondSide > EPSILON)) &&
    ((thirdSide > EPSILON && fourthSide < -EPSILON) ||
      (thirdSide < -EPSILON && fourthSide > EPSILON))
  ) {
    return true
  }
  return (
    pointOnSegment(secondStart, firstStart, firstEnd) ||
    pointOnSegment(secondEnd, firstStart, firstEnd) ||
    pointOnSegment(firstStart, secondStart, secondEnd) ||
    pointOnSegment(firstEnd, secondStart, secondEnd)
  )
}

const wireSegments = (trace: SimplifiedPcbTrace) => {
  const segments: Array<{ a: Point; b: Point; layer: string }> = []
  let previousWire:
    | Extract<SimplifiedPcbTrace["route"][number], { route_type: "wire" }>
    | undefined
  for (const point of trace.route) {
    if (point.route_type !== "wire") {
      previousWire = undefined
      continue
    }
    if (previousWire && previousWire.layer === point.layer) {
      segments.push({ a: previousWire, b: point, layer: point.layer })
    }
    previousWire = point
  }
  return segments
}

export const validateBusChannelTraces = (
  input: SimpleRouteJson,
  plan: BusChannelPlan,
  traces: readonly SimplifiedPcbTrace[],
): void => {
  const assignmentByConnectionName = new Map(
    plan.assignments.flatMap((assignment) =>
      assignment.connectionNamesInWindingOrder.map(
        (name) => [name, assignment] as const,
      ),
    ),
  )
  for (const trace of traces) {
    const connectionName = trace.connection_name
    if (!connectionName) {
      throw new Error("Bus channel output trace is missing a connection name")
    }
    const assignment = assignmentByConnectionName.get(connectionName)
    if (!assignment) continue
    if (trace.route.some((point) => point.route_type !== "wire")) {
      throw new Error(
        `Bus channel trace "${trace.connection_name}" added a layer transition`,
      )
    }
    if (
      trace.route.some(
        (point) =>
          point.route_type === "wire" && point.layer !== assignment.selectedLayer,
      )
    ) {
      throw new Error(
        `Bus channel trace "${trace.connection_name}" left whole-bus layer "${assignment.selectedLayer}"`,
      )
    }
  }

  for (let firstIndex = 0; firstIndex < traces.length; firstIndex++) {
    const first = traces[firstIndex]!
    for (let secondIndex = firstIndex + 1; secondIndex < traces.length; secondIndex++) {
      const second = traces[secondIndex]!
      if (first.connection_name === second.connection_name) continue
      for (const firstSegment of wireSegments(first)) {
        for (const secondSegment of wireSegments(second)) {
          if (firstSegment.layer !== secondSegment.layer) continue
          if (
            segmentsIntersect(
              firstSegment.a,
              firstSegment.b,
              secondSegment.a,
              secondSegment.b,
            )
          ) {
            throw new Error(
              `Bus channel traces "${first.connection_name}" and "${second.connection_name}" cross or touch on "${firstSegment.layer}"`,
            )
          }
        }
      }
    }
  }

  const expectedNames = new Set(input.connections.map((connection) => connection.name))
  if (
    traces.some(
      (trace) =>
        !trace.connection_name || !expectedNames.has(trace.connection_name),
    )
  ) {
    throw new Error("Bus channel output contains an unknown connection")
  }
}
