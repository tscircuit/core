import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SinglePadChip = ({
  name,
  pcbX,
  pcbY,
}: {
  name: string
  pcbX: number
  pcbY: number
}) => (
  <chip
    name={name}
    pcbX={pcbX}
    pcbY={pcbY}
    footprint={
      <footprint>
        <smtpad portHints={["pin1"]} shape="circle" radius="0.1mm" />
      </footprint>
    }
  />
)

test("fanout avoids a different-net trace routed by an earlier phase", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="10mm"
      height="4mm"
      layers={2}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.15mm"
      minViaPadDiameter="0.25mm"
    >
      <autoroutingphase phaseIndex={0} />
      <autoroutingphase
        phaseIndex={1}
        autorouter="fanout"
        fanoutRoutingLayers={["top", "bottom"]}
        fanoutBoundaryPadding={{ right: "3mm" }}
      />

      <SinglePadChip name="U_SIGNAL" pcbX={-2} pcbY={0} />
      <SinglePadChip name="U_SIGNAL_TARGET" pcbX={2} pcbY={0} />
      <SinglePadChip name="U_PRE_BOTTOM" pcbX={-1} pcbY={-0.75} />
      <SinglePadChip name="U_PRE_TOP" pcbX={-1} pcbY={0.75} />

      <bus name="SIGNAL_BUS" connections={["SIGNAL"]} routingPhaseIndex={1} />
      <trace
        name="PRE_ROUTED"
        from=".U_PRE_BOTTOM > .pin1"
        to=".U_PRE_TOP > .pin1"
        routingPhaseIndex={0}
      />
      <trace
        name="SIGNAL"
        from=".U_SIGNAL > .pin1"
        to=".U_SIGNAL_TARGET > .pin1"
        routingPhaseIndex={1}
      />

      <pcbnotetext
        pcbX={0}
        pcbY={1.5}
        fontSize={0.35}
        text="Phase 1 fanout avoids phase 0 copper"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingPhaseIoStack).toHaveLength(3)
  const fanoutInput = autoroutingPhaseIoStack[1]?.startSimpleRouteJson
  const fanoutOutput = autoroutingPhaseIoStack[1]?.endSimpleRouteJson
  if (!fanoutInput || !fanoutOutput) {
    throw new Error("Expected phase 1 fanout input and output")
  }

  expect(fanoutInput.connections).toHaveLength(1)
  expect(fanoutInput.traces).toHaveLength(1)
  const preRoutedSourceTrace = circuit.db.source_trace.getWhere({
    name: "PRE_ROUTED",
  })
  const signalSourceTrace = circuit.db.source_trace.getWhere({
    name: "SIGNAL",
  })
  expect(fanoutInput.traces?.[0]?.connection_name).toBe(
    preRoutedSourceTrace?.source_trace_id,
  )
  expect(
    fanoutInput.traces?.[0]?.route.every(
      (routePoint) =>
        routePoint.route_type !== "wire" || routePoint.layer === "top",
    ),
  ).toBe(true)

  const fanoutSignalTrace = fanoutOutput.traces?.find(
    (trace) => trace.connection_name === signalSourceTrace?.source_trace_id,
  )
  expect(fanoutSignalTrace).toBeDefined()
  expect(
    fanoutSignalTrace?.route.some(
      (routePoint) =>
        routePoint.route_type === "wire" && routePoint.layer === "bottom",
    ),
  ).toBe(true)

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
