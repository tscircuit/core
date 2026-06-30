import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"
import { isGraphScopeTrace } from "./isGraphScopeTrace"

const timestamps_ms = Array.from({ length: 11 }, (_, index) => index)

const fakeSpiceEngine: SpiceEngine = {
  async simulate() {
    return {
      simulationResultCircuitJson: [
        {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: "fake",
          name: "VIN",
          timestamps_ms,
          voltage_levels: timestamps_ms.map(
            (time) => 4 + Math.sin((time / 10) * Math.PI * 2),
          ),
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 10,
        },
        {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: "fake",
          name: "VOUT",
          timestamps_ms,
          voltage_levels: timestamps_ms.map((time) => 5 * (1 - 0.72 ** time)),
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 10,
        },
        {
          type: "simulation_transient_current_graph",
          simulation_experiment_id: "fake",
          name: "I_RAMP",
          timestamps_ms,
          current_levels: timestamps_ms.map((time) => time * 0.001),
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 10,
        },
        {
          type: "simulation_transient_current_graph",
          simulation_experiment_id: "fake",
          name: "I_PULSE",
          timestamps_ms,
          current_levels: timestamps_ms.map((time) =>
            time % 3 === 0 ? 0.018 : 0.003,
          ),
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 10,
        },
      ],
    }
  },
}

test("simulation graph splits four voltage and current shapes onto independent axes", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        fake: fakeSpiceEngine,
      },
    },
  })

  circuit.add(
    <board width="12mm" height="12mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="5V" schX={-4} />
      <ammeter
        name="I_RAMP"
        color="#e05a00"
        graphDisplayName="I ramp"
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <resistor name="R1" resistance="1k" schX={2} />
      <ammeter
        name="I_PULSE"
        color="#8a35d7"
        graphDisplayName="I pulse"
        connections={{
          pos: ".R1 > .pin2",
          neg: ".V1 > .pin2",
        }}
      />
      <voltageprobe
        name="VIN"
        color="#315cff"
        connectsTo=".I_RAMP > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="VIN sine"
      />
      <voltageprobe
        name="VOUT"
        color="#0a8f3c"
        connectsTo=".R1 > .pin2"
        referenceTo=".V1 > .pin2"
        graphDisplayName="VOUT charge"
      />
      <analogsimulation
        name="four independent graph shapes"
        duration="10ms"
        timePerStep="1ms"
        spiceEngine="fake"
        graphIndependentAxes
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const graphScopeTraces = circuitJson.filter(isGraphScopeTrace)

  expect(graphScopeTraces).toHaveLength(4)
  expect(
    graphScopeTraces.map((trace) => trace.display_center_offset_divs),
  ).toEqual([3, 1, -1, -3])

  await expect(circuitJson).toMatchSimulationSnapshot(import.meta.path)
})
