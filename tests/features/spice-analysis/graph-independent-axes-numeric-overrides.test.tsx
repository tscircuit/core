import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"
import { isGraphScopeTrace } from "./isGraphScopeTrace"

const timestamps_ms = Array.from({ length: 4 }, (_, index) => index)

const fakeSpiceEngine: SpiceEngine = {
  async simulate() {
    return {
      simulationResultCircuitJson: [
        {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: "fake",
          name: "V_NUMERIC",
          timestamps_ms,
          voltage_levels: [1, 2, 3, 4],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 3,
        },
        {
          type: "simulation_transient_current_graph",
          simulation_experiment_id: "fake",
          name: "I_NUMERIC",
          timestamps_ms,
          current_levels: [0.001, 0.002, 0.003, 0.004],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 3,
        },
      ],
    }
  },
}

test("graphIndependentAxes accepts numeric explicit graph overrides", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        fake: fakeSpiceEngine,
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="4V" schX={-3} />
      <ammeter
        name="I_NUMERIC"
        color="#8a35d7"
        graphDisplayName="I numeric"
        graphCenter={0.002}
        graphVerticalOffset={0.001}
        graphCurrentPerDiv={0.0005}
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <resistor name="R1" resistance="1k" schX={2} />
      <trace from=".R1 > .pin2" to=".V1 > .pin2" />
      <voltageprobe
        name="V_NUMERIC"
        color="#315cff"
        connectsTo=".I_NUMERIC > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="V numeric"
        graphCenter={2}
        graphVerticalOffset={1}
        graphVoltagePerDiv={0.5}
      />
      <analogsimulation
        name="numeric independent graph overrides"
        duration="3ms"
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
      display_name: "V numeric",
      display_center_value: 2,
      display_center_offset_divs: 2,
      volts_per_div: 0.5,
    },
    {
      display_name: "I numeric",
      display_center_value: 0.002,
      display_center_offset_divs: 2,
      amps_per_div: 0.0005,
    },
  ])

  await expect(circuitJson).toMatchSimulationSnapshot(import.meta.path)
})
