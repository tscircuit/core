import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { isGraphScopeTrace } from "./isGraphScopeTrace"

const timestamps_ms = Array.from({ length: 4 }, (_, index) => index)

const fakeSpiceEngine: SpiceEngine = {
  async simulate() {
    return {
      simulationResultCircuitJson: [
        {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: "fake",
          name: "V_SCI",
          timestamps_ms,
          voltage_levels: [0, 0.001, 0.002, 0.003],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 3,
        },
        {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: "fake",
          name: "V_SCI_SI",
          timestamps_ms,
          voltage_levels: [0, 0.5, 1.0, 1.5],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 3,
        },
        {
          type: "simulation_transient_current_graph",
          simulation_experiment_id: "fake",
          name: "I_SCI",
          timestamps_ms,
          current_levels: [0, 0.0005, 0.001, 0.0015],
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 3,
        },
      ],
    }
  },
}

test("graphIndependentAxes parses scientific notation in voltage and current overrides", async () => {
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
        name="I_SCI"
        color="#8a35d7"
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
        name="V_SCI"
        color="#315cff"
        connectsTo=".I_SCI > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="V sci"
        graphCenter={0.002}
        graphVerticalOffset="2e-3V"
        graphVoltagePerDiv="1e-3V"
      />
      <voltageprobe
        name="V_SCI_SI"
        color="#0a8f3c"
        connectsTo=".R1 > .pin1"
        referenceTo=".V1 > .pin2"
        graphDisplayName="V sci SI"
        graphCenter={0.5}
        graphVerticalOffset="-2.5e2mV"
        graphVoltagePerDiv="5e2mV"
      />
      <analogsimulation
        name="scientific notation independent graph overrides"
        duration="3ms"
        timePerStep="1ms"
        spiceEngine="fake"
        graphIndependentAxes
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const probeScopeTraces = circuitJson.filter(
    (el) =>
      el.type === "simulation_oscilloscope_trace" && !isGraphScopeTrace(el),
  )
  const graphScopeTraces = circuitJson.filter(isGraphScopeTrace)

  expect(probeScopeTraces).toHaveLength(3)
  expect(probeScopeTraces).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        display_name: "V sci",
        volts_per_div: 0.001,
        display_center_offset_divs: 2,
      }),
      expect.objectContaining({
        display_name: "V sci SI",
        volts_per_div: 0.5,
        display_center_offset_divs: -0.5,
      }),
      expect.objectContaining({
        display_name: "I sci",
        amps_per_div: 0.0005,
        display_center_offset_divs: 2,
      }),
    ]),
  )

  expect(graphScopeTraces).toHaveLength(3)
  expect(graphScopeTraces).toMatchObject([
    {
      display_name: "V sci",
      display_center_value: 0.002,
      display_center_offset_divs: 2,
      volts_per_div: 0.001,
    },
    {
      display_name: "V sci SI",
      display_center_value: 0.5,
      display_center_offset_divs: -0.5,
      volts_per_div: 0.5,
    },
    {
      display_name: "I sci",
      display_center_value: 0.001,
      display_center_offset_divs: 2,
      amps_per_div: 0.0005,
    },
  ])
})
