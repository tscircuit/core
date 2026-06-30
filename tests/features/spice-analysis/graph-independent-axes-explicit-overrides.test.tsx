import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"
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
          voltage_levels: [0, 2, 4, 6, 8, 10],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 5,
        },
        {
          type: "simulation_transient_current_graph",
          simulation_experiment_id: "fake",
          name: "I_CUSTOM",
          timestamps_ms,
          current_levels: [0, 0.002, 0.004, 0.006, 0.008, 0.01],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 5,
        },
      ],
    }
  },
}

test("graphIndependentAxes uses explicit voltage and current graph overrides", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        fake: fakeSpiceEngine,
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="10V" schX={-3} />
      <ammeter
        name="I_CUSTOM"
        color="#8a35d7"
        graphDisplayName="I explicit"
        graphCenter={0.004}
        graphVerticalOffset="1mA"
        graphCurrentPerDiv="2mA"
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <resistor name="R1" resistance="1k" schX={2} />
      <trace from=".R1 > .pin2" to=".V1 > .pin2" />
      <voltageprobe
        name="V_CUSTOM"
        color="#315cff"
        connectsTo=".I_CUSTOM > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="V explicit"
        graphCenter={2}
        graphVerticalOffset="1V"
        graphVoltagePerDiv="2V"
      />
      <analogsimulation
        name="explicit independent graph overrides"
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
      display_name: "V explicit",
      display_center_value: 2,
      display_center_offset_divs: 0.5,
      volts_per_div: 2,
    },
    {
      display_name: "I explicit",
      display_center_value: 0.004,
      display_center_offset_divs: 0.5,
      amps_per_div: 0.002,
    },
  ])

  await expect(circuitJson).toMatchSimulationSnapshot(import.meta.path)
})
