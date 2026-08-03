import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

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

test("binds differential-pair metadata to the route between two breakouts", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const differentialPairFootprint = (
    <footprint>
      <smtpad
        portHints={["pin1"]}
        pcbX={0}
        pcbY={-0.35}
        width="0.35mm"
        height="0.35mm"
        shape="rect"
      />
      <smtpad
        portHints={["pin2"]}
        pcbX={0}
        pcbY={0.35}
        width="0.35mm"
        height="0.35mm"
        shape="rect"
      />
    </footprint>
  )

  circuit.add(
    <board width="20mm" height="10mm" layers={4}>
      <autoroutingphase
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createBasicAutorouter(async (simpleRouteJson) =>
            routeConnectionsDirectly(simpleRouteJson),
          ),
        }}
      />
      <breakout
        name="U1_BREAKOUT"
        pcbX={-5}
        width="4mm"
        height="4mm"
        fanoutBoundaryPadding={{ right: "0.8mm" }}
        busFanoutDirections={{ USB: "center_right" }}
      >
        <chip name="U1" footprint={differentialPairFootprint} />
      </breakout>
      <breakout
        name="U2_BREAKOUT"
        pcbX={5}
        width="4mm"
        height="4mm"
        fanoutBoundaryPadding={{ left: "0.8mm" }}
        busFanoutDirections={{ USB: "center_left" }}
      >
        <chip name="U2" footprint={differentialPairFootprint} />
      </breakout>
      <trace name="USB_P" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="USB_N" from=".U1 > .pin2" to=".U2 > .pin2" />
      <bus name="USB" connections={["USB_P", "USB_N"]} />
      <differentialpair
        name="USB_PAIR"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew="0.1mm"
        pcbTraceGap="0.12mm"
      />
      <pcbnotetext
        text="Pair metadata applies after both fanouts"
        pcbY={4}
        fontSize="0.35mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const positiveSourceTraceId = circuit.db.source_trace.getWhere({
    name: "USB_P",
  })!.source_trace_id
  const negativeSourceTraceId = circuit.db.source_trace.getWhere({
    name: "USB_N",
  })!.source_trace_id
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(3)
  expect(
    autoroutingPhaseIoStack.map(
      (phaseIo) => phaseIo.startSimpleRouteJson?.traces?.length ?? 0,
    ),
  ).toEqual([0, 0, 4])
  expect(
    autoroutingPhaseIoStack[2]?.startSimpleRouteJson?.traces?.map(
      (trace) => trace.connection_name,
    ),
  ).toEqual([
    positiveSourceTraceId,
    negativeSourceTraceId,
    positiveSourceTraceId,
    negativeSourceTraceId,
  ])
  expect(
    autoroutingPhaseIoStack
      .slice(0, 2)
      .every(
        (phaseIo) =>
          phaseIo.startSimpleRouteJson?.differentialPairs === undefined,
      ),
  ).toBe(true)
  const globalPhaseInput = autoroutingPhaseIoStack[2]?.startSimpleRouteJson
  expect(globalPhaseInput?.differentialPairs).toEqual([
    {
      connectionNames: [
        positiveSourceTraceId,
        negativeSourceTraceId,
      ],
      lengthTolerance: 0.1,
      traceGap: 0.12,
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
