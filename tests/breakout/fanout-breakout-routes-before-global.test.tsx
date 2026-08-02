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

  circuit.add(
    <board
      width="20mm"
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
        <chip name="U1" footprint={<footprint>{bgaPads}</footprint>} />
        <trace name="GND_DROP" from=".U1 > .pin1" to="net.GND" />
      </breakout>

      {signalPinNumbers.map((pinNumber, busIndex) => (
        <resistor
          key={pinNumber}
          name={`R${busIndex + 1}`}
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={busIndex * 2 - 3}
        />
      ))}
      {signalPinNumbers.map((pinNumber, busIndex) => (
        <trace
          key={`${pinNumber}`}
          name={`DATA${busIndex}`}
          from={`.U1 > .pin${pinNumber}`}
          to={`.R${busIndex + 1} > .pin1`}
        />
      ))}
      <bus
        name="DATA_BUS"
        connections={signalPinNumbers.map((_, busIndex) => `DATA${busIndex}`)}
      />
      <pcbnotetext
        text="One local signal + plane fanout, then global DATA routing"
        pcbY={5}
        fontSize="0.3mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(
    autoroutingPhaseIoStack.map(
      (phaseIo) => phaseIo.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual([5, 4])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
