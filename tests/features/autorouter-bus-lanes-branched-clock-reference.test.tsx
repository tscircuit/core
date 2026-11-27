import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

test("lengthMatchTo measures the selected clock path without its termination branch", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={22} schematicDisabled routeRemaining={false}>
      <LengthTestTerminal name="CLK_TX" x={-6} y={4} />
      <LengthTestTerminal name="CLK_RX" x={6} y={4} />
      <LengthTestTerminal name="CLK_TERM" x={8} y={8} />
      <LengthTestTerminal name="DQ_TX" x={-6} y={-3} />
      <LengthTestTerminal name="DQ_RX" x={2} y={-3} />
      <net
        name="CLK"
        connectsTo={["CLK_TX.pin1", "CLK_RX.pin1", "CLK_TERM.pin1"]}
        routingPhaseIndex={0}
      />
      <trace
        name="CLOCK_PATH"
        path={["CLK_TX.pin1", "CLK_RX.pin1", "net.CLK"]}
        routingPhaseIndex={0}
      />
      <trace
        name="DQ"
        from="DQ_TX.pin1"
        to="DQ_RX.pin1"
        routingPhaseIndex={1}
      />
      <bus
        name="CLOCK"
        connections={["CLOCK_PATH"]}
        pcbAllowedLayers={["top"]}
      />
      <bus
        name="DATA"
        connections={["DQ"]}
        lengthMatchTo="CLOCK_PATH"
        maxLengthSkew={0.5}
        pcbAllowedLayers={["top"]}
      />
      <autoroutingphase
        name="CLOCK_ROUTING"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
      <autoroutingphase
        name="DATA_ROUTING"
        phaseIndex={1}
        autorouter="bus_lanes"
      />
      <pcbnotetext text="Clock path: 12 mm" pcbY={5} fontSize={0.5} />
      <pcbnotetext text="Termination" pcbX={7} pcbY={9.5} fontSize={0.4} />
      <pcbnotetext
        text="DATA matches the 12 mm clock path; the termination branch is excluded"
        pcbY={-8}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const dataSourceTrace = circuit.db.source_trace.getWhere({ name: "DQ" })!
  const dataLength = circuit.db.pcb_trace
    .list()
    .filter(
      (trace) => trace.source_trace_id === dataSourceTrace.source_trace_id,
    )
    .reduce(
      (length, trace) =>
        length +
        trace.route.slice(1).reduce((sum, point, index) => {
          const previous = trace.route[index]
          if (point.route_type !== "wire" || previous.route_type !== "wire")
            return sum
          return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
        }, 0),
      0,
    )
  expect(dataLength).toBeGreaterThanOrEqual(11.499999)
  expect(dataLength).toBeLessThanOrEqual(12.500001)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showDebugObjects: false,
    shouldDrawRatsNest: false,
  })
})
