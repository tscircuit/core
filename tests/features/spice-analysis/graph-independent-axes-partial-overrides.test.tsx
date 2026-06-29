import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"
import { isGraphScopeTrace } from "./isGraphScopeTrace"

const timestamps_ms = Array.from({ length: 5 }, (_, index) => index)

const fakeSpiceEngine: SpiceEngine = {
  async simulate() {
    return {
      simulationResultCircuitJson: [
        {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: "fake",
          name: "V_CENTER_ONLY",
          timestamps_ms,
          voltage_levels: [-5, -2.5, 0, 2.5, 5],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 4,
        },
        {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: "fake",
          name: "V_PER_DIV_ONLY",
          timestamps_ms,
          voltage_levels: [1, 2, 3, 4, 5],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 4,
        },
        {
          type: "simulation_transient_current_graph",
          simulation_experiment_id: "fake",
          name: "I_OFFSET_ONLY",
          timestamps_ms,
          current_levels: [-0.002, -0.001, 0, 0.001, 0.002],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 4,
        },
      ],
    }
  },
}

test("graphIndependentAxes combines explicit partial overrides with auto values", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        fake: fakeSpiceEngine,
      },
    },
  })

  circuit.add(
    <board width="12mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="5V" schX={-4} />
      <ammeter
        name="I_OFFSET_ONLY"
        color="#8a35d7"
        graphDisplayName="I offset only"
        graphVerticalOffset="1mA"
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <resistor name="R1" resistance="1k" schX={0} />
      <resistor name="R2" resistance="2k" schX={4} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".V1 > .pin2" />
      <voltageprobe
        name="V_CENTER_ONLY"
        color="#315cff"
        connectsTo=".I_OFFSET_ONLY > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="V center only"
        graphCenter={1.25}
      />
      <voltageprobe
        name="V_PER_DIV_ONLY"
        color="#0a8f3c"
        connectsTo=".R2 > .pin1"
        referenceTo=".V1 > .pin2"
        graphDisplayName="V per div only"
        graphVoltagePerDiv="2V"
      />
      <analogsimulation
        name="partial independent graph overrides"
        duration="4ms"
        timePerStep="1ms"
        spiceEngine="fake"
        graphIndependentAxes
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const graphScopeTraces = circuitJson.filter(isGraphScopeTrace)

  expect(graphScopeTraces).toHaveLength(3)
  expect(graphScopeTraces).toMatchObject([
    {
      display_name: "V center only",
      display_center_value: 1.25,
      display_center_offset_divs: 2,
      volts_per_div: 6.25,
    },
    {
      display_name: "V per div only",
      display_center_value: 3,
      display_center_offset_divs: 0,
      volts_per_div: 2,
    },
    {
      display_name: "I offset only",
      display_center_value: 0,
      display_center_offset_divs: 0.4,
      amps_per_div: 0.0025,
    },
  ])

  await expect(circuitJson).toMatchSimulationSnapshot(import.meta.path)
})
