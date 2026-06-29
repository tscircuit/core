import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"
import { isGraphScopeTrace } from "./isGraphScopeTrace"

const timestamps_ms = Array.from({ length: 9 }, (_, index) => index)

const fakeSpiceEngine: SpiceEngine = {
  async simulate() {
    return {
      simulationResultCircuitJson: [
        {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: "fake",
          name: "VREF",
          timestamps_ms,
          voltage_levels: timestamps_ms.map(() => 3.3),
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 8,
        },
        {
          type: "simulation_transient_current_graph",
          simulation_experiment_id: "fake",
          name: "I_TINY",
          timestamps_ms,
          current_levels: timestamps_ms.map((time) =>
            time % 2 === 0 ? 0.000001 : -0.000001,
          ),
          time_per_step: 1,
          start_time_ms: 0,
          end_time_ms: 8,
        },
      ],
    }
  },
}

test("simulation graph independently scales flat voltage and tiny current signals", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        fake: fakeSpiceEngine,
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="3.3V" schX={-3} />
      <resistor name="R1" resistance="1M" schX={2} />
      <ammeter
        name="I_TINY"
        color="#8a35d7"
        graphDisplayName="I tiny"
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <trace from=".R1 > .pin2" to=".V1 > .pin2" />
      <voltageprobe
        name="VREF"
        color="#315cff"
        connectsTo=".I_TINY > .pos"
        referenceTo=".V1 > .pin2"
        graphDisplayName="VREF flat"
      />
      <analogsimulation
        name="flat and tiny independent graph shapes"
        duration="8ms"
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
  expect(
    graphScopeTraces.every((trace) =>
      Number.isFinite(trace.volts_per_div ?? trace.amps_per_div),
    ),
  ).toBe(true)

  await expect(circuitJson).toMatchSimulationSnapshot(import.meta.path)
})
