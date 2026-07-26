import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { analog } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("snapshots analog DC operating point voltage and current results", async () => {
  const fakeEngine: SpiceEngine = {
    async simulate() {
      return {
        simulationResultCircuitJson: [
          {
            type: "simulation_dc_operating_point_voltage",
            simulation_dc_operating_point_voltage_id: "result_vout",
            simulation_experiment_id: "fake_experiment",
            simulation_voltage_probe_id: "probe_vout",
            name: "VOUT",
            voltage: 3.3,
            color: "#315cff",
          },
          {
            type: "simulation_dc_operating_point_current",
            simulation_dc_operating_point_current_id: "result_load_current",
            simulation_experiment_id: "fake_experiment",
            simulation_current_probe_id: "probe_load_current",
            name: "I(RLOAD)",
            current: 1.2,
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
      <voltagesource name="V1" voltage="5V" schX={-1.5} schY={0} />
      <resistor
        name="Rload"
        resistance="1kΩ"
        schX={1.5}
        schY={0}
        schRotation={180}
      />
      <trace from=".V1 > .pin1" to=".Rload > .pin1" schDisplayLabel="GND" />
      <trace from=".V1 > .pin2" to=".Rload > .pin2" />
      <voltageprobe name="VOUT" connectsTo=".Rload > .pin2" />
      <analog.dcoperatingpointsimulation
        name="DC Bias Point"
        spiceEngine="fake"
      />
    </board>,
  )

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
