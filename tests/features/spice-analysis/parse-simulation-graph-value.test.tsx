import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { isGraphScopeTrace } from "./isGraphScopeTrace"

const timestamps_ms = Array.from({ length: 6 }, (_, index) => index)

const fakeSpiceEngine: SpiceEngine = {
  async simulate() {
    return {
      simulationResultCircuitJson: [
        {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: "fake",
          name: "V_CUSTOM",
          timestamps_ms,
          voltage_levels: [0, 0.001, 0.002, 0.003, 0.004, 0.005],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 5,
        },
        {
          type: "simulation_transient_current_graph",
          simulation_experiment_id: "fake",
          name: "I_CUSTOM",
          timestamps_ms,
          current_levels: [0, 0.0005, 0.001, 0.0015, 0.002, 0.0025],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 5,
        },
      ],
    }
  },
}

test("parseSimulationGraphValue supports scientific notation with optional SI prefixes", () => {
  expect(parseSimulationGraphValue("1e-3V")).toBe(0.001)
  expect(parseSimulationGraphValue("5e-4A")).toBe(0.0005)
  expect(parseSimulationGraphValue("5e2mV")).toBe(0.5)
  expect(parseSimulationGraphValue("+1E-3A")).toBe(0.001)
  expect(parseSimulationGraphValue("-2.5e-6V")).toBeCloseTo(-0.0000025)
  expect(parseSimulationGraphValue(".5e3mV")).toBe(0.5)
})

test("parseSimulationGraphValue preserves decimal, SI-prefixed, and numeric inputs", () => {
  expect(parseSimulationGraphValue("10V")).toBe(10)
  expect(parseSimulationGraphValue("10mV")).toBe(0.01)
  expect(parseSimulationGraphValue("1.5k")).toBe(1500)
  expect(parseSimulationGraphValue("-2.5u")).toBeCloseTo(-0.0000025)
  expect(parseSimulationGraphValue(1e-3)).toBe(0.001)
  expect(parseSimulationGraphValue(undefined)).toBeUndefined()
  expect(parseSimulationGraphValue("invalid")).toBeUndefined()
  expect(parseSimulationGraphValue("")).toBeUndefined()
})

test("voltageprobe and ammeter emit expected scales and offset divisions for scientific notation strings", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        fake: fakeSpiceEngine,
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="5mV" schX={-3} />
      <ammeter
        name="I_CUSTOM"
        graphDisplayName="I sci"
        graphCenter={0.001}
        graphVerticalOffset="+1E-3A"
        graphCurrentPerDiv="5e-4A"
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <resistor name="R1" resistance="1k" schX={2} />
      <trace from=".R1 > .pin2" to=".V1 > .pin2" />
      <voltageprobe
        name="V_CUSTOM"
        connectsTo=".I_CUSTOM > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="V sci"
        graphCenter={0.002}
        graphVerticalOffset="2e-3V"
        graphVoltagePerDiv="1e-3V"
      />
      <analogsimulation
        name="scientific notation graph overrides"
        duration="5ms"
        timePerStep="1ms"
        spiceEngine="fake"
        graphIndependentAxes
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const graphScopeTraces = circuitJson.filter(isGraphScopeTrace)

  expect(graphScopeTraces).toHaveLength(2)
  expect(graphScopeTraces).toMatchObject([
    {
      display_name: "V sci",
      display_center_value: 0.002,
      display_center_offset_divs: 2,
      volts_per_div: 0.001,
    },
    {
      display_name: "I sci",
      display_center_value: 0.001,
      display_center_offset_divs: 2,
      amps_per_div: 0.0005,
    },
  ])
})
