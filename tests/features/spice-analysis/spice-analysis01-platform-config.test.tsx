import { test, expect } from "bun:test"
import type { SimulationTransientVoltageGraph } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("spice-analysis01-platform-config", async () => {
  const { circuit } = getTestFixture()

  circuit.platform = {
    spiceEngineMap: {
      spicey: {
        async simulate(spiceString: string) {
          return {
            simulationResultCircuitJson: [
              {
                type: "simulation_experiment",
                simulation_experiment_id: "1",
              } as any,
              {
                type: "simulation_transient_voltage_graph",
                simulation_experiment_id: "1",
                voltage_levels: [
                  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
                ],
                start_time_ms: 0,
                end_time_ms: 10,
                time_per_step: 0.001,
                simulation_transient_voltage_graph_id:
                  "simulation-transient-voltage-graph-1",
                name: "simulation-transient-voltage-graph-1",
              } as SimulationTransientVoltageGraph,
            ],
          }
        },
      },
    },
  }

  circuit.add(
    <board>
      <voltagesource
        name="VS1"
        peakToPeakVoltage="3V"
        frequency="1kHz"
        waveShape="square"
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        connections={{ pos: "VS1.1", neg: "VS1.2" }}
      />
      <resistor
        name="R1"
        resistance="1k"
        connections={{ pin1: "VS1.1", pin2: "VS1.2" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  expect(
    circuitJson.some((el) => el.type === "simulation_transient_voltage_graph"),
  ).toBe(true)

  expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
