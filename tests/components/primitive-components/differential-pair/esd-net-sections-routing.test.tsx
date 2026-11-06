import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local points in right-handed mm: +X right, +Y up, +Z top.
const pads = () => (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      pcbX={0}
      pcbY={0.5}
      width={0.6}
      height={0.6}
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX={0}
      pcbY={-0.5}
      width={0.6}
      height={0.6}
      shape="rect"
    />
  </footprint>
)

test("routes net-attached CPU and connector pair sections through the same ESD pads", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board
      width={18}
      height={10}
      schematicDisabled
      routeRemaining={false}
      minTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.1}
    >
      <chip
        name="SOC"
        footprint={pads()}
        pcbX={-6}
        pinLabels={{ pin1: "P", pin2: "N" }}
      />
      <chip
        name="ESD"
        footprint={pads()}
        pinLabels={{ pin1: "P", pin2: "N" }}
      />
      <chip
        name="USB"
        footprint={pads()}
        pcbX={6}
        pinLabels={{ pin1: "P", pin2: "N" }}
      />
      <autoroutingphase
        name="CPU_TO_ESD"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
      <autoroutingphase
        name="ESD_TO_USB"
        phaseIndex={1}
        autorouter="auto_local"
      />
      <trace
        name="P_CPU"
        path={[".SOC > .P", ".ESD > .P", "net.USB_P"]}
        routingPhaseIndex={0}
      />
      <trace
        name="N_CPU"
        path={[".SOC > .N", ".ESD > .N", "net.USB_N"]}
        routingPhaseIndex={0}
      />
      <trace
        name="P_PORT"
        path={[".ESD > .P", ".USB > .P", "net.USB_P"]}
        routingPhaseIndex={1}
      />
      <trace
        name="N_PORT"
        path={[".ESD > .N", ".USB > .N", "net.USB_N"]}
        routingPhaseIndex={1}
      />
      <differentialpair
        name="CPU_PAIR"
        positiveConnection="P_CPU"
        negativeConnection="N_CPU"
        maxLengthSkew={0.1}
        pcbTraceGap={0.15}
      />
      <differentialpair
        name="PORT_PAIR"
        positiveConnection="P_PORT"
        negativeConnection="N_PORT"
        maxLengthSkew={0.1}
        pcbTraceGap={0.15}
      />
      <bus
        name="CPU_BUS"
        connections={["P_CPU", "N_CPU"]}
        pcbAllowedLayers={["top"]}
        maxLengthSkew={0.1}
      />
      <bus
        name="PORT_BUS"
        connections={["P_PORT", "N_PORT"]}
        pcbAllowedLayers={["top"]}
        maxLengthSkew={0.1}
      />
      <pcbnotetext pcbX={-6} pcbY={-1.4} text="SOC P/N" fontSize={0.35} />
      <pcbnotetext pcbX={0} pcbY={-1.4} text="ESD P/N" fontSize={0.35} />
      <pcbnotetext pcbX={6} pcbY={-1.4} text="USB P/N" fontSize={0.35} />
      <pcbnotetext
        pcbY={3}
        text="SOC → ESD → USB: explicit pair sections on shared nets"
        fontSize={0.4}
      />
      <pcbnotetext
        pcbY={-3}
        text="CPU: bus-lanes / USB: auto-local; four traces, no duplicate trunk"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.getCircuitJson().filter((e) => e.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit.db.source_property_ignored_warning.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(4)
  for (const [phaseIndex, suffix] of ["CPU", "PORT"].entries()) {
    const phaseInput = inputs[phaseIndex]
    const traceIds = ["P", "N"].map(
      (polarity) =>
        circuit.db.source_trace.getWhere({ name: `${polarity}_${suffix}` })!
          .source_trace_id,
    )
    expect(phaseInput.connections.map((c) => c.name)).toEqual(traceIds)
    expect(phaseInput.differentialPairs).toEqual([
      {
        connectionNames: [traceIds[0], traceIds[1]],
        lengthTolerance: 0.1,
        traceGap: 0.15,
      },
    ])
    expect(
      phaseInput.connections.every((c) => c.pointsToConnect.length === 2),
    ).toBe(true)
    const lengths = traceIds.map((source_trace_id) =>
      circuit.db.pcb_trace
        .getWhere({ source_trace_id })!
        .route.reduce((length, point, index, route) => {
          const previous = route[index - 1]
          return (
            length +
            (point.route_type === "wire" && previous?.route_type === "wire"
              ? Math.hypot(point.x - previous.x, point.y - previous.y)
              : 0)
          )
        }, 0),
    )
    expect(Math.abs(lengths[0] - lengths[1])).toBeLessThanOrEqual(0.100001)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
