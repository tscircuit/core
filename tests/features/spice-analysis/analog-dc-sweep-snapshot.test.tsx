import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { analog } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("snapshots analog DC sweep voltage and current graphs", async () => {
  const fakeEngine: SpiceEngine = {
    async simulate() {
      return {
        simulationResultCircuitJson: [
          {
            type: "simulation_dc_sweep_voltage_graph",
            simulation_dc_sweep_voltage_graph_id: "result_vout",
            simulation_experiment_id: "fake_experiment",
            simulation_voltage_probe_id: "probe_vout",
            name: "VOUT",
            sweep_values: [0, 1, 2, 3, 4, 5],
            sweep_unit: "V",
            voltage_levels: [0, 0.9, 1.8, 2.7, 3.3, 3.3],
            color: "#315cff",
          },
          {
            type: "simulation_dc_sweep_current_graph",
            simulation_dc_sweep_current_graph_id: "result_load_current",
            simulation_experiment_id: "fake_experiment",
            simulation_current_probe_id: "probe_load_current",
            name: "I(RLOAD)",
            sweep_values: [0, 1, 2, 3, 4, 5],
            sweep_unit: "V",
            current_levels: [0, 0.45, 0.9, 1.35, 1.65, 1.65],
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
      <voltagesource name="Vin" voltage="5V" />
      <resistor
        name="Rload"
        resistance="1kΩ"
        connections={{ pin1: ".Vin > .pin1", pin2: ".Vin > .pin2" }}
      />
      <voltageprobe name="VOUT" connectsTo=".Rload > .pin1" />
      <analog.dcsweepsimulation
        name="Line Regulation"
        sweepSource=".Vin"
        sweepStart="0V"
        sweepStop="5V"
        sweepStep="1V"
        spiceEngine="fake"
      />
    </board>,
  )

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
