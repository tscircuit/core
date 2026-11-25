import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

const planarLength = (trace: PcbTrace): number =>
  trace.route.slice(1).reduce((length, point, index) => {
    const previous = trace.route[index]
    if (point.route_type !== "wire" || previous.route_type !== "wire") {
      throw new Error("Expected the declared top-layer bus routes")
    }
    return length + Math.hypot(point.x - previous.x, point.y - previous.y)
  }, 0)

test.failing(
  "TSX data bus matches clocks completed in an earlier bus_lanes phase",
  async () => {
    const { circuit } = getTestFixture()
    const solverNames: Array<string | undefined> = []
    circuit.on("autorouting:start", ({ solverName }) =>
      solverNames.push(solverName),
    )
    circuit.add(
      <board width={24} height={22} schematicDisabled routeRemaining={false}>
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
        <LengthTestTerminal name="CLK_TX_P" x={-8} y={5} />
        <LengthTestTerminal name="CLK_RX_P" x={8} y={5} />
        <LengthTestTerminal name="CLK_TX_N" x={-8} y={2} />
        <LengthTestTerminal name="CLK_RX_N" x={8} y={2} />
        <LengthTestTerminal name="CLOCK_OBSTACLE_P" x={0} y={5} />
        <LengthTestTerminal name="CLOCK_OBSTACLE_N" x={0} y={2} />
        <LengthTestTerminal name="DQ_TX_0" x={-8} y={-2} />
        <LengthTestTerminal name="DQ_RX_0" x={4} y={-2} />
        <LengthTestTerminal name="DQ_TX_1" x={-8} y={-5} />
        <LengthTestTerminal name="DQ_RX_1" x={3.5} y={-5} />
        <trace
          name="CLK_P"
          from=".CLK_TX_P > .pin1"
          to=".CLK_RX_P > .pin1"
          routingPhaseIndex={0}
        />
        <trace
          name="CLK_N"
          from=".CLK_TX_N > .pin1"
          to=".CLK_RX_N > .pin1"
          routingPhaseIndex={0}
        />
        <trace
          name="DQ0"
          from=".DQ_TX_0 > .pin1"
          to=".DQ_RX_0 > .pin1"
          routingPhaseIndex={1}
        />
        <trace
          name="DQ1"
          from=".DQ_TX_1 > .pin1"
          to=".DQ_RX_1 > .pin1"
          routingPhaseIndex={1}
        />
        <bus
          name="CLOCK"
          connections={["CLK_P", "CLK_N"]}
          routingPhaseIndex={0}
          maxLengthSkew={0.1}
          pcbAllowedLayers={["top"]}
          pcbTraceWidth={0.15}
        />
        <bus
          name="DATA"
          connections={["DQ0", "DQ1"]}
          lengthMatchTo={["CLK_P", "CLK_N"]}
          routingPhaseIndex={1}
          maxLengthSkew={0.5}
          pcbAllowedLayers={["top"]}
          pcbTraceWidth={0.15}
        />
        <pcbnotetext
          text="CLOCK phase 0: CLK_P and CLK_N"
          pcbY={9}
          fontSize={0.65}
        />
        <pcbnotetext
          text="DATA phase 1: DQ0 and DQ1"
          pcbY={-8}
          fontSize={0.65}
        />
        <pcbnotetext
          text="Clock references include the routed detours around the pads"
          pcbY={7.5}
          fontSize={0.4}
        />
        <pcbnotetext
          text="lengthMatchTo: CLK_P, CLK_N; maxLengthSkew: 0.5 mm"
          pcbY={-9.5}
          fontSize={0.45}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      width: 1000,
      height: 900,
      shouldDrawRatsNest: false,
      showDebugObjects: false,
    })
    expect(solverNames).toEqual([
      "BusLanesPipelineSolver",
      "BusLanesPipelineSolver",
    ])
    expect(circuit.db.pcb_trace.list()).toHaveLength(4)
    expect(circuit.db.pcb_via.list()).toHaveLength(0)
    expect(
      circuit
        .getCircuitJson()
        .filter((element) => element.type.endsWith("_error")),
    ).toEqual([])
    const lengths = circuit.db.pcb_trace.list().map(planarLength)
    expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(
      0.500001,
    )
  },
)
