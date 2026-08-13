import { expect } from "bun:test"
import { convertPcbTraceToSimplifiedPcbTrace } from "lib/components/primitive-components/Group/region-replacement"
import type { RootCircuit } from "lib/RootCircuit"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ControllerSections } from "tests/repros/fixtures/rp2040-motor-controller/schematic/ControllerSections"
import {
  MotorDriverControlTraces,
  MotorDriverController,
  MotorDriverGroundTraces,
  MotorDriverPassives,
  MotorDriverPowerTraces,
  MotorDriverPrimaryGroundTraces,
  MotorDriverSenseAndControlTraces,
} from "tests/repros/fixtures/rp2040-motor-controller/schematic/MotorDriverCoreSection"
import {
  MotorOutputConnectors,
  MotorOutputTraces,
} from "tests/repros/fixtures/rp2040-motor-controller/schematic/MotorOutputsSection"
import {
  MotorPowerFilteringComponents,
  MotorPowerFilteringGroundTrace,
  MotorPowerFilteringSupplyTrace,
} from "tests/repros/fixtures/rp2040-motor-controller/schematic/MotorPowerFilteringSection"
import {
  MotorPowerPdConnectorGroundTraces,
  MotorPowerPdControllers,
  MotorPowerPdInputTraces,
  MotorPowerPdPassives,
  MotorPowerPdPrimaryGroundTrace,
  MotorPowerPdProtocolTraces,
  MotorPowerPdSupportGroundTraces,
} from "tests/repros/fixtures/rp2040-motor-controller/schematic/MotorPowerPdNegotiationSection"

export type Point = { x: number; y: number }
type ViaRoutePoint = Extract<
  SimplifiedPcbTrace["route"][number],
  { route_type: "via" }
>
type WireRoutePoint = Extract<
  SimplifiedPcbTrace["route"][number],
  { route_type: "wire" }
>

type AdjacentSegment = {
  start: Point
  end: Point
  width: number
}

type ViaStitchingContext = {
  incomingSegment: AdjacentSegment
  outgoingSegment: AdjacentSegment
  perpendicularDirection: Point
  traceWidth: number
}

export const SAME_POINT_TOLERANCE = 1e-9
const VIA_STITCHING_ROTATIONS = [0, 15, -15, 30, -30, 45, -45].map(
  (degrees) => (degrees * Math.PI) / 180,
)

const getConnectionNames = (value: unknown): string[] => {
  if (typeof value !== "string" || value.length === 0) return []

  return value.split("__").flatMap((name) => {
    const rerouteSuffixIndex = name.indexOf("_reroute_")
    return rerouteSuffixIndex > 0
      ? [name, name.slice(0, rerouteSuffixIndex)]
      : [name]
  })
}

const getTraceConnectionNames = (
  trace: SimplifiedPcbTrace,
  routedBoard: SimpleRouteJson,
) => {
  const traceWithSourceId = trace as SimplifiedPcbTrace & {
    source_trace_id?: string
    rootConnectionName?: string
  }
  const traceConnectionNames = new Set(
    [
      trace.connection_name,
      trace.pcb_trace_id,
      traceWithSourceId.source_trace_id,
      traceWithSourceId.rootConnectionName,
      ...(trace.connectsTo ?? []),
    ].flatMap(getConnectionNames),
  )

  const matchingConnectionNames = new Set(traceConnectionNames)
  for (const connection of routedBoard.connections) {
    const connectionNames = [
      connection.name,
      connection.source_trace_id,
      connection.rootConnectionName,
      ...(connection.mergedConnectionNames ?? []),
    ].flatMap(getConnectionNames)
    if (!connectionNames.some((name) => traceConnectionNames.has(name))) {
      continue
    }

    for (const connectionName of connectionNames) {
      matchingConnectionNames.add(connectionName)
    }
  }

  return matchingConnectionNames
}

const getRequestedTraceWidth = (
  trace: SimplifiedPcbTrace,
  routedBoard: SimpleRouteJson,
) => {
  const traceConnectionNames = getTraceConnectionNames(trace, routedBoard)

  return routedBoard.connections.reduce((requestedTraceWidth, connection) => {
    const connectionNames = [
      connection.name,
      connection.source_trace_id,
      connection.rootConnectionName,
      ...(connection.mergedConnectionNames ?? []),
    ].flatMap(getConnectionNames)
    if (!connectionNames.some((name) => traceConnectionNames.has(name))) {
      return requestedTraceWidth
    }

    return Math.max(
      requestedTraceWidth,
      connection.nominalTraceWidth ?? connection.width ?? 0,
    )
  }, 0)
}

const distancePointToSegment = (point: Point, start: Point, end: Point) => {
  const segmentX = end.x - start.x
  const segmentY = end.y - start.y
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2
  if (segmentLengthSquared <= SAME_POINT_TOLERANCE) {
    return Math.hypot(point.x - start.x, point.y - start.y)
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) /
        segmentLengthSquared,
    ),
  )
  return Math.hypot(
    point.x - (start.x + segmentX * projection),
    point.y - (start.y + segmentY * projection),
  )
}

const getViaStitchingContext = (
  route: SimplifiedPcbTrace["route"],
  viaIndex: number,
  via: ViaRoutePoint,
  requestedTraceWidth: number,
): ViaStitchingContext | null => {
  let previousWire: WireRoutePoint | undefined
  let previousAnchor: WireRoutePoint | undefined
  for (let routeIndex = viaIndex - 1; routeIndex >= 0; routeIndex--) {
    const routePoint = route[routeIndex]
    if (routePoint?.route_type !== "wire") continue
    previousWire ??= routePoint
    if (
      Math.hypot(routePoint.x - via.x, routePoint.y - via.y) >
      SAME_POINT_TOLERANCE
    ) {
      previousAnchor = routePoint
      break
    }
  }

  let nextWire: WireRoutePoint | undefined
  let nextAnchor: WireRoutePoint | undefined
  for (let routeIndex = viaIndex + 1; routeIndex < route.length; routeIndex++) {
    const routePoint = route[routeIndex]
    if (routePoint?.route_type !== "wire") continue
    nextWire ??= routePoint
    if (
      Math.hypot(routePoint.x - via.x, routePoint.y - via.y) >
      SAME_POINT_TOLERANCE
    ) {
      nextAnchor = routePoint
      break
    }
  }

  if (!previousWire || !previousAnchor || !nextWire || !nextAnchor) return null

  const incomingLength = Math.hypot(
    via.x - previousAnchor.x,
    via.y - previousAnchor.y,
  )
  const outgoingLength = Math.hypot(nextAnchor.x - via.x, nextAnchor.y - via.y)
  if (
    incomingLength <= SAME_POINT_TOLERANCE ||
    outgoingLength <= SAME_POINT_TOLERANCE
  ) {
    return null
  }

  const incomingDirection = {
    x: (via.x - previousAnchor.x) / incomingLength,
    y: (via.y - previousAnchor.y) / incomingLength,
  }
  const outgoingDirection = {
    x: (nextAnchor.x - via.x) / outgoingLength,
    y: (nextAnchor.y - via.y) / outgoingLength,
  }
  const traceDirection = {
    x: incomingDirection.x + outgoingDirection.x,
    y: incomingDirection.y + outgoingDirection.y,
  }
  let traceDirectionLength = Math.hypot(traceDirection.x, traceDirection.y)
  if (traceDirectionLength <= SAME_POINT_TOLERANCE) {
    traceDirection.x = incomingDirection.x
    traceDirection.y = incomingDirection.y
    traceDirectionLength = 1
  }

  return {
    incomingSegment: {
      start: previousAnchor,
      end: via,
      width: requestedTraceWidth,
    },
    outgoingSegment: {
      start: via,
      end: nextAnchor,
      width: requestedTraceWidth,
    },
    perpendicularDirection: {
      x: -traceDirection.y / traceDirectionLength,
      y: traceDirection.x / traceDirectionLength,
    },
    traceWidth: requestedTraceWidth,
  }
}

const viaFitsInsideTraceSegment = (
  via: Point,
  viaDiameter: number,
  segment: AdjacentSegment,
) =>
  distancePointToSegment(via, segment.start, segment.end) + viaDiameter / 2 <=
  segment.width / 2 + SAME_POINT_TOLERANCE

const viaArrayIsClearOfOtherTraces = ({
  viaStitches,
  viaDiameter,
  trace,
  allTraces,
  routedBoard,
  clearance,
}: {
  viaStitches: ViaRoutePoint[]
  viaDiameter: number
  trace: SimplifiedPcbTrace
  allTraces: SimplifiedPcbTrace[]
  routedBoard: SimpleRouteJson
  clearance: number
}) => {
  const traceConnectionNames = getTraceConnectionNames(trace, routedBoard)

  for (const otherTrace of allTraces) {
    if (otherTrace === trace) continue

    const otherConnectionNames = getTraceConnectionNames(
      otherTrace,
      routedBoard,
    )
    const tracesAreConnected = [...otherConnectionNames].some((name) =>
      traceConnectionNames.has(name),
    )

    for (const otherPoint of otherTrace.route) {
      if (otherPoint.route_type !== "via") continue
      const otherViaDiameter = otherPoint.via_diameter ?? viaDiameter
      if (
        viaStitches.some(
          (stitch) =>
            Math.hypot(stitch.x - otherPoint.x, stitch.y - otherPoint.y) -
              viaDiameter / 2 -
              otherViaDiameter / 2 <
            clearance - SAME_POINT_TOLERANCE,
        )
      ) {
        return false
      }
    }

    if (tracesAreConnected) continue

    for (
      let pointIndex = 0;
      pointIndex < otherTrace.route.length - 1;
      pointIndex++
    ) {
      const start = otherTrace.route[pointIndex]
      const end = otherTrace.route[pointIndex + 1]
      if (
        start?.route_type !== "wire" ||
        end?.route_type !== "wire" ||
        start.layer !== end.layer
      ) {
        continue
      }
      if (
        viaStitches.some(
          (stitch) =>
            distancePointToSegment(stitch, start, end) -
              viaDiameter / 2 -
              Math.max(start.width, end.width) / 2 <
            clearance - SAME_POINT_TOLERANCE,
        )
      ) {
        return false
      }
    }
  }

  return true
}

const createViaStitchCandidates = ({
  via,
  context,
  viaDiameter,
  viaClearance,
}: {
  via: ViaRoutePoint
  context: ViaStitchingContext
  viaDiameter: number
  viaClearance: number
}): ViaRoutePoint[][] => {
  const viaCount = Math.floor(
    (context.traceWidth + viaClearance) / (viaDiameter + viaClearance),
  )
  if (viaCount < 2) return []

  const centerIndex = (viaCount - 1) / 2
  const viaPitch = (context.traceWidth - viaDiameter) / (viaCount - 1)

  return VIA_STITCHING_ROTATIONS.flatMap((rotation) => {
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    const direction = {
      x:
        context.perpendicularDirection.x * cos -
        context.perpendicularDirection.y * sin,
      y:
        context.perpendicularDirection.x * sin +
        context.perpendicularDirection.y * cos,
    }
    const viaStitches = Array.from(
      { length: viaCount },
      (_, stitchIndex): ViaRoutePoint => {
        const offset = (stitchIndex - centerIndex) * viaPitch
        return {
          ...via,
          x: via.x + direction.x * offset,
          y: via.y + direction.y * offset,
        }
      },
    )

    return viaStitches.every(
      (stitch) =>
        viaFitsInsideTraceSegment(
          stitch,
          viaDiameter,
          context.incomingSegment,
        ) &&
        viaFitsInsideTraceSegment(stitch, viaDiameter, context.outgoingSegment),
    )
      ? [viaStitches]
      : []
  })
}

export const stitchWideTraceVias = (
  traces: SimplifiedPcbTrace[],
  simpleRouteJson: SimpleRouteJson,
  routedBoard: SimpleRouteJson,
) => {
  const stitchedTraces = structuredClone(traces)
  const viaDiameter =
    simpleRouteJson.min_via_pad_diameter ??
    simpleRouteJson.minViaPadDiameter ??
    simpleRouteJson.minViaDiameter ??
    0.6
  const viaClearance = Math.max(
    simpleRouteJson.defaultObstacleMargin ?? 0,
    simpleRouteJson.minTraceToPadEdgeClearance ?? 0,
    0.1,
  )
  let stitchedViaArrayCount = 0
  let addedViaCount = 0
  let wideTraceViaCount = 0
  const stitchedViaCenters: Point[] = []

  for (const trace of stitchedTraces) {
    const routedTraceWidth = Math.max(
      0,
      ...trace.route.flatMap((point) =>
        point.route_type === "wire" ? [point.width] : [],
      ),
    )
    const requestedTraceWidth = Math.max(
      routedTraceWidth,
      getRequestedTraceWidth(trace, routedBoard),
    )

    for (let routeIndex = 0; routeIndex < trace.route.length; routeIndex++) {
      const routePoint = trace.route[routeIndex]
      if (routePoint?.route_type !== "via") continue
      if (requestedTraceWidth <= viaDiameter) continue
      wideTraceViaCount++

      const context = getViaStitchingContext(
        trace.route,
        routeIndex,
        routePoint,
        requestedTraceWidth,
      )
      if (!context) continue

      const stitchedViaDiameter = routePoint.via_diameter ?? viaDiameter
      const viaStitches = createViaStitchCandidates({
        via: routePoint,
        context,
        viaDiameter: stitchedViaDiameter,
        viaClearance,
      }).find((candidate) =>
        viaArrayIsClearOfOtherTraces({
          viaStitches: candidate,
          viaDiameter: stitchedViaDiameter,
          trace,
          allTraces: stitchedTraces,
          routedBoard,
          clearance: viaClearance,
        }),
      )
      if (!viaStitches) continue

      trace.route.splice(routeIndex, 1, ...viaStitches)
      stitchedViaCenters.push(...viaStitches.map(({ x, y }) => ({ x, y })))
      routeIndex += viaStitches.length - 1
      stitchedViaArrayCount++
      addedViaCount += viaStitches.length - 1
    }
  }

  return {
    traces: stitchedTraces,
    stitchedViaArrayCount,
    addedViaCount,
    wideTraceViaCount,
    stitchedViaCenters,
  }
}

export const setupViaStitchingPhases = ({
  circuit,
  routedPhaseName,
}: {
  circuit: RootCircuit
  routedPhaseName: string
}) => {
  let routedBoard: SimpleRouteJson | undefined
  let stitchedViaArrayCount = 0
  let addedViaCount = 0
  let wideTraceViaCount = 0
  const stitchedViaCenters: Point[] = []
  const completedPhaseNames: string[] = []

  circuit.on("autorouting:end", ({ phaseName, simpleRouteJson }) => {
    completedPhaseNames.push(phaseName)
    if (phaseName !== routedPhaseName) return

    const materializedTraces = circuit.db.pcb_trace
      .list()
      .map(convertPcbTraceToSimplifiedPcbTrace)
    routedBoard = {
      ...structuredClone(simpleRouteJson),
      traces: [
        ...materializedTraces,
        ...structuredClone(simpleRouteJson.traces ?? []),
      ],
    }
  })

  const addViaStitching = createBasicAutorouter(async (simpleRouteJson) => {
    if (!routedBoard) {
      throw new Error("The board must be routed before stitching")
    }

    const result = stitchWideTraceVias(
      routedBoard.traces ?? [],
      simpleRouteJson,
      routedBoard,
    )
    stitchedViaArrayCount += result.stitchedViaArrayCount
    addedViaCount += result.addedViaCount
    wideTraceViaCount += result.wideTraceViaCount
    stitchedViaCenters.push(...result.stitchedViaCenters)
    return result.traces
  })

  return {
    addViaStitching,
    getResult: () => ({
      routedTraceCount: routedBoard?.traces?.length ?? 0,
      stitchedViaArrayCount,
      addedViaCount,
      wideTraceViaCount,
      stitchedViaCenters: [...stitchedViaCenters],
      completedPhaseNames: [...completedPhaseNames],
    }),
  }
}

export const runRp2040MotorControllerViaStitchingRepro = async (
  snapshotTestPath: string,
) => {
  const { circuit } = getTestFixture({
    platform: { placementDrcChecksDisabled: true },
  })
  let routedBoard: SimpleRouteJson | undefined
  let stitchedViaArrayCount = 0
  let addedViaCount = 0
  let wideTraceViaCount = 0
  const stitchedViaCenters: Point[] = []

  circuit.on("autorouting:end", ({ phaseName, simpleRouteJson }) => {
    if (phaseName !== "route-board") return

    const childSubcircuitTraces = circuit.db.pcb_trace
      .list()
      .map(convertPcbTraceToSimplifiedPcbTrace)
    routedBoard = {
      ...structuredClone(simpleRouteJson),
      traces: [
        ...childSubcircuitTraces,
        ...structuredClone(simpleRouteJson.traces ?? []),
      ],
    }
  })

  const addViaStitching = createBasicAutorouter(async (simpleRouteJson) => {
    if (!routedBoard)
      throw new Error("The board must be routed before stitching")

    const result = stitchWideTraceVias(
      routedBoard.traces ?? [],
      simpleRouteJson,
      routedBoard,
    )
    stitchedViaArrayCount += result.stitchedViaArrayCount
    addedViaCount += result.addedViaCount
    wideTraceViaCount += result.wideTraceViaCount
    stitchedViaCenters.push(...result.stitchedViaCenters)
    return result.traces
  })

  circuit.add(
    <board
      width="90mm"
      height="75mm"
      schematicDisabled
      minViaPadDiameter="0.45mm"
      minViaHoleDiameter="0.3mm"
      // Let the full-board route converge before post-route via stitching.
      autorouterEffortLevel="2x"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
      }}
    >
      <net name="GND" routingPhaseIndex={0} />

      <ControllerSections />
      <MotorDriverController />
      <MotorPowerPdControllers />
      <MotorOutputConnectors />
      <MotorPowerFilteringComponents />
      <MotorPowerPdPassives />
      <MotorDriverPassives />

      <MotorDriverControlTraces />
      <MotorPowerPdInputTraces />
      <MotorPowerFilteringSupplyTrace />
      <MotorPowerPdProtocolTraces />
      <MotorDriverPowerTraces />
      <MotorDriverPrimaryGroundTraces />
      <MotorPowerPdPrimaryGroundTrace />
      <MotorPowerPdConnectorGroundTraces />
      <MotorPowerFilteringGroundTrace />
      <MotorPowerPdSupportGroundTraces />
      <MotorDriverGroundTraces />
      <MotorOutputTraces />
      <MotorDriverSenseAndControlTraces />

      <copperpour
        name="GND_TOP"
        layer="top"
        connectsTo="net.GND"
        clearance="0.2mm"
        padMargin="0.2mm"
        traceMargin="0.2mm"
        boardEdgeMargin="0.3mm"
        coveredWithSolderMask
      />
      <copperpour
        name="GND_BOTTOM"
        layer="bottom"
        connectsTo="net.GND"
        clearance="0.2mm"
        padMargin="0.2mm"
        traceMargin="0.2mm"
        boardEdgeMargin="0.3mm"
        coveredWithSolderMask
      />

      <autoroutingphase name="route-board" phaseIndex={0} />
      <autoroutingphase
        name="stitch-wide-traces"
        phaseIndex={1}
        reroute
        region={{ minX: -45, maxX: 45, minY: -37.5, maxY: 37.5 }}
        autorouter={{ algorithmFn: addViaStitching }}
      />

      <hole diameter="3.2mm" pcbX={-41} pcbY={33} />
      <hole diameter="3.2mm" pcbX={41} pcbY={33} />
      <hole diameter="3.2mm" pcbX={-41} pcbY={-33} />
      <hole diameter="3.2mm" pcbX={41} pcbY={-33} />

      <silkscreentext
        text="RP2040 DUAL MOTOR"
        fontSize="1.2mm"
        pcbX={-2}
        pcbY={34}
      />
      <silkscreentext
        text="USB-C PD MOTOR"
        fontSize="1mm"
        pcbX={34}
        pcbY={22}
      />
      <silkscreentext text="REQUESTS 9V" fontSize="0.9mm" pcbX={34} pcbY={19} />
      <silkscreentext text="MOTOR A" fontSize="1mm" pcbX={32} pcbY={-2} />
      <silkscreentext text="MOTOR B" fontSize="1mm" pcbX={32} pcbY={-22} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(routedBoard?.traces?.length).toBeGreaterThan(0)
  expect(wideTraceViaCount).toBeGreaterThan(0)
  expect(stitchedViaArrayCount).toBeGreaterThan(0)
  expect(addedViaCount).toBeGreaterThan(0)

  const stitchedViaIds = new Set(
    circuit.db.pcb_via
      .list()
      .filter((via) =>
        stitchedViaCenters.some(
          (center) =>
            Math.hypot(via.x - center.x, via.y - center.y) <
            SAME_POINT_TOLERANCE,
        ),
      )
      .map((via) => via.pcb_via_id),
  )
  expect(stitchedViaIds.size).toBeGreaterThan(0)
  expect(
    circuit.db.pcb_via_clearance_error
      .list()
      .filter((error) =>
        error.pcb_via_ids.some((viaId) => stitchedViaIds.has(viaId)),
      ),
  ).toEqual([])
  expect(
    circuit.db.pcb_via_trace_clearance_error
      .list()
      .filter((error) => stitchedViaIds.has(error.pcb_via_id)),
  ).toEqual([])
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" && point.x < -20 && point.y > 20,
        ),
      ),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(snapshotTestPath, {
    diffThresholdPercent: 1,
  })
}
