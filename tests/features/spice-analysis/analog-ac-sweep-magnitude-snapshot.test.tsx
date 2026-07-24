import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { analog } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const frequenciesHz = [10, 100, 1_000, 10_000, 100_000, 1_000_000]
const complexVoltages = [
  { re: 1, im: -0.01 },
  { re: 0.99, im: -0.05 },
  { re: 0.9, im: -0.2 },
  { re: 0.5, im: -0.5 },
  { re: 0.08, im: -0.25 },
  { re: 0.005, im: -0.05 },
]
const complexCurrents = [
  { re: -0.6, im: 0.01 },
  { re: -0.59, im: 0.04 },
  { re: -0.52, im: 0.12 },
  { re: -0.3, im: 0.3 },
  { re: -0.05, im: 0.15 },
  { re: -0.003, im: 0.03 },
]

test("snapshots analog AC sweep magnitude graphs", async () => {
  const fakeEngine: SpiceEngine = {
    async simulate() {
      return {
        simulationResultCircuitJson: [
          {
            type: "simulation_ac_sweep_voltage_graph",
            simulation_ac_sweep_voltage_graph_id: "result_vout",
            simulation_experiment_id: "fake_experiment",
            simulation_voltage_probe_id: "probe_vout",
            name: "VOUT",
            frequencies_hz: frequenciesHz,
            complex_voltages: complexVoltages,
            color: "#315cff",
          },
          {
            type: "simulation_ac_sweep_current_graph",
            simulation_ac_sweep_current_graph_id: "result_input_current",
            simulation_experiment_id: "fake_experiment",
            simulation_current_probe_id: "probe_input_current",
            name: "I(VIN)",
            frequencies_hz: frequenciesHz,
            complex_currents: complexCurrents,
            color: "#dc2626",
          },
        ],
      }
    },
  }
  const { circuit } = getTestFixture({
    platform: { spiceEngineMap: { fake: fakeEngine } },
  })

  circuit.add(
    <board routingDisabled>
      <voltagesource name="Vin" voltage="5V" acMagnitude="1V" />
      <resistor
        name="Rload"
        resistance="1kΩ"
        connections={{ pin1: ".Vin > .pin1", pin2: ".Vin > .pin2" }}
      />
      <voltageprobe name="VOUT" connectsTo=".Rload > .pin1" />
      <analog.acsweepsimulation
        name="Frequency Response"
        sweepType="decade"
        samplesPerInterval={10}
        startFrequency="10Hz"
        stopFrequency="1MHz"
        spiceEngine="fake"
      />
    </board>,
  )

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
