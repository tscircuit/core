import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const signalPinNumbers = [6, 7, 10, 11]

const routeConnectionsDirectly = (
  simpleRouteJson: SimpleRouteJson,
): SimplifiedPcbTrace[] =>
  simpleRouteJson.connections.map((connection) => ({
    type: "pcb_trace",
    pcb_trace_id: `${connection.name}_routed`,
    connection_name: connection.source_trace_id ?? connection.name,
    route: connection.pointsToConnect.map((point) => ({
      route_type: "wire",
      x: point.x,
      y: point.y,
      width: connection.nominalTraceWidth ?? 0.1,
      layer: point.layer,
    })),
  }))

test("fanout breakout routes signals and plane drops before global routing", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const createBgaPads = () =>
    Array.from({ length: 16 }, (_, padIndex) => {
      const pinNumber = padIndex + 1
      return (
        <Fragment key={pinNumber}>
          <smtpad
            portHints={[`pin${pinNumber}`]}
            pcbX={(padIndex % 4) * 0.8 - 1.2}
            pcbY={Math.floor(padIndex / 4) * 0.8 - 1.2}
            shape="circle"
            radius="0.175mm"
          />
        </Fragment>
      )
    })

  circuit.add(
    <board
      width="24mm"
      height="12mm"
      layers={4}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <autoroutingphase
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createBasicAutorouter(async (simpleRouteJson) =>
            routeConnectionsDirectly(simpleRouteJson),
          ),
        }}
      />
      <copperpour layer="inner1" connectsTo="net.GND" />
      <breakout
        name="U1_BREAKOUT"
        pcbX={-4}
        width="6mm"
        height="6mm"
        fanoutBoundaryPadding={{ right: "1.2mm" }}
        fanoutRoutingLayers={["top", "bottom"]}
        fanoutPourNetMap={{ inner1: "GND" }}
        busFanoutDirections={{ DATA_BUS: "center_right" }}
      >
        <chip name="U1" footprint={<footprint>{createBgaPads()}</footprint>} />
        <trace name="GND_DROP" from=".U1 > .pin1" to="net.GND" />
      </breakout>

      <breakout
        name="U2_BREAKOUT"
        pcbX={4}
        width="6mm"
        height="6mm"
        fanoutBoundaryPadding={{ left: "1.2mm" }}
        fanoutRoutingLayers={["top", "bottom"]}
        busFanoutDirections={{ DATA_BUS: "center_left" }}
      >
        <chip name="U2" footprint={<footprint>{createBgaPads()}</footprint>} />
      </breakout>

      {signalPinNumbers.map((pinNumber, busIndex) => (
        <trace
          key={`${pinNumber}`}
          name={`DATA${busIndex}`}
          from={`.U1 > .pin${pinNumber}`}
          to={`.U2 > .pin${pinNumber}`}
        />
      ))}
      <bus
        name="DATA_BUS"
        connections={signalPinNumbers.map((_, busIndex) => `DATA${busIndex}`)}
      />
      <pcbnotetext
        text="Two independent fanouts, then global DATA routing"
        pcbY={5}
        fontSize="0.3mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(3)
  expect(
    autoroutingPhaseIoStack.map(
      (phaseIo) => phaseIo.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual([5, 4, 4])

  const breakoutGroups = ["U1_BREAKOUT", "U2_BREAKOUT"].map((name) => {
    const group = circuit.db.pcb_group.getWhere({ name })
    expect(group?.width).toBe(6)
    expect(group?.height).toBe(6)
    if (!group?.width || !group.height) {
      throw new Error(`Expected ${name} to have rectangular bounds`)
    }
    return group
  })
  const isOnBreakoutBoundary = (point: { x: number; y: number }): boolean =>
    breakoutGroups.some((group) => {
      const boundary = {
        minX: group.center.x - group.width! / 2,
        maxX: group.center.x + group.width! / 2,
        minY: group.center.y - group.height! / 2,
        maxY: group.center.y + group.height! / 2,
      }
      return (
        ((Math.abs(point.x - boundary.minX) <= 1e-6 ||
          Math.abs(point.x - boundary.maxX) <= 1e-6) &&
          point.y >= boundary.minY - 1e-6 &&
          point.y <= boundary.maxY + 1e-6) ||
        ((Math.abs(point.y - boundary.minY) <= 1e-6 ||
          Math.abs(point.y - boundary.maxY) <= 1e-6) &&
          point.x >= boundary.minX - 1e-6 &&
          point.x <= boundary.maxX + 1e-6)
      )
    })

  const globalBoundaryPoints =
    autoroutingPhaseIoStack[2]?.startSimpleRouteJson?.connections.flatMap(
      (connection) => connection.pointsToConnect.filter(isOnBreakoutBoundary),
    ) ?? []
  expect(globalBoundaryPoints).toHaveLength(8)

  const fanoutWirePoints = autoroutingPhaseIoStack
    .slice(0, 2)
    .flatMap((phase) => phase.endSimpleRouteJson?.traces ?? [])
    .flatMap((trace) => trace.route)
    .filter((point) => point.route_type === "wire")
  for (const globalBoundaryPoint of globalBoundaryPoints) {
    expect(
      fanoutWirePoints.some(
        (fanoutPoint) =>
          Math.abs(fanoutPoint.x - globalBoundaryPoint.x) <= 1e-6 &&
          Math.abs(fanoutPoint.y - globalBoundaryPoint.y) <= 1e-6 &&
          fanoutPoint.layer === globalBoundaryPoint.layer,
      ),
    ).toBe(true)
  }

  const breakoutPoints = circuit.db.pcb_breakout_point.list()
  expect(breakoutPoints).toHaveLength(8)
  expect(breakoutPoints.every(isOnBreakoutBoundary)).toBe(true)

  const boundaryConflictWarnings = circuit.db.source_property_ignored_warning
    .list()
    .filter((warning) => warning.property_name === "fanoutBoundaryPadding")
  expect(boundaryConflictWarnings).toHaveLength(2)
  expect(
    boundaryConflictWarnings.every((warning) =>
      warning.message.includes("Explicit breakout geometry takes precedence"),
    ),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
