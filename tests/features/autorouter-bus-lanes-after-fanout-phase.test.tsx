import { expect, test } from "bun:test"
import type { AutoroutingEndEvent, AutoroutingStartEvent } from "lib/events"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const innerPinNumbers = [6, 7, 10, 11]

const createBoard = ({
  includeFanoutConnections,
}: {
  includeFanoutConnections: boolean
}) => {
  const bgaPads = Array.from({ length: 16 }, (_, padIndex) => {
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

  return (
    <board
      width="20mm"
      height="12mm"
      layers={4}
      routeRemaining={false}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <autoroutingphase
        name="FANOUT_STAGE"
        phaseIndex={0}
        autorouter="fanout"
        connections={
          includeFanoutConnections ? ["D0", "D1", "D2", "D3"] : undefined
        }
        busFanoutDirections={{ DATA: { direction: "center_right" } }}
        fanoutBoundaryPadding={{ right: "1.2mm" }}
      />
      <autoroutingphase
        name="BUS_LANES_0"
        phaseIndex={1}
        autorouter="bus_lanes"
        connections={["D0", "D1"]}
      />
      <autoroutingphase
        name="BUS_LANES_1"
        phaseIndex={2}
        autorouter="bus_lanes"
        connections={["D2", "D3"]}
      />
      <chip name="U1" pcbX={-4} footprint={<footprint>{bgaPads}</footprint>} />
      <bus
        name="DATA"
        connections={["D0", "D1", "D2", "D3"]}
        preferredLayer="bottom"
        preferredLayers={["bottom"]}
      />
      {innerPinNumbers.map((pinNumber, busIndex) => (
        <Fragment key={pinNumber}>
          <resistor
            name={`R${busIndex + 1}`}
            resistance="1k"
            footprint="0402"
            layer="bottom"
            pcbX={5}
            pcbY={busIndex * 2 - 3}
          />
          <trace
            name={`D${busIndex}`}
            from={`.U1 > .pin${pinNumber}`}
            to={`.R${busIndex + 1} > .pin1`}
          />
        </Fragment>
      ))}
    </board>
  )
}

test("fanout autoroutingphase carries escaped copper and relocated exit points into subsequent bus_lanes phases", async () => {
  for (const includeFanoutConnections of [true, false]) {
    const { circuit } = getTestFixture()
    const startEvents: AutoroutingStartEvent[] = []
    const endEvents: AutoroutingEndEvent[] = []
    circuit.on("autorouting:start", (event) => startEvents.push(event))
    circuit.on("autorouting:end", (event) => endEvents.push(event))

    circuit.add(createBoard({ includeFanoutConnections }))
    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(
      startEvents.map((event) => ({
        phaseName: event.phaseName,
        autorouterName: event.autorouterName,
        connectionCount: event.simpleRouteJson.connections.length,
        previousTraceCount: event.simpleRouteJson.traces?.length ?? 0,
      })),
    ).toEqual([
      {
        phaseName: "FANOUT_STAGE",
        autorouterName: "fanout",
        connectionCount: 4,
        previousTraceCount: 0,
      },
      {
        phaseName: "BUS_LANES_0",
        autorouterName: "bus_lanes",
        connectionCount: 2,
        previousTraceCount: 4,
      },
      {
        phaseName: "BUS_LANES_1",
        autorouterName: "bus_lanes",
        connectionCount: 2,
        previousTraceCount: 6,
      },
    ])

    expect(endEvents[0]?.pcbTracePathsUnavailableReason).toBeUndefined()
    expect(endEvents[0]?.pcbTracePaths).toHaveLength(4)

    const fanoutTraceEndPoints = (
      endEvents[0]!.simpleRouteJson.traces ?? []
    ).flatMap((trace) => {
      const lastPoint = trace.route.at(-1)
      return lastPoint && lastPoint.route_type === "wire" ? [lastPoint] : []
    })
    const firstBusLanePoints =
      startEvents[1]!.simpleRouteJson.connections.flatMap(
        (connection) => connection.pointsToConnect,
      )
    expect(
      firstBusLanePoints.some((point) =>
        fanoutTraceEndPoints.some(
          (exitPoint) =>
            Math.abs(point.x - exitPoint.x) < 1e-6 &&
            Math.abs(point.y - exitPoint.y) < 1e-6 &&
            point.layer === exitPoint.layer,
        ),
      ),
    ).toBe(true)
  }
})
