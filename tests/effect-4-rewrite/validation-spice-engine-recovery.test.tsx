import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a synchronous SPICE engine failure retains its error while another simulation succeeds", async () => {
  const { circuit } = getTestFixture({
    platform: {
      pcbDisabled: true,
      schematicDisabled: true,
      drcChecksDisabled: true,
      spiceEngineMap: {
        broken: {
          simulate: () => {
            throw new Error("SPICE initialization failed")
          },
        },
        retained: {
          simulate: async () => ({
            simulationResultCircuitJson: [
              {
                type: "simulation_dc_operating_point_voltage",
                simulation_dc_operating_point_voltage_id: "success",
                simulation_experiment_id: "fake",
                simulation_voltage_probe_id: "fake-probe",
                voltage: 3,
              },
            ],
          }),
        },
      },
    },
  })
  circuit.add(
    <board routingDisabled>
      <voltagesource name="V1" voltage="5V" />
      <resistor name="R1" resistance="1k" />
      <trace from=".V1 > .pin1" to=".R1 > .pin1" />
      <trace from=".V1 > .pin2" to=".R1 > .pin2" />
      <analogsimulation
        name="failed"
        spiceEngine="broken"
        duration="1ms"
        timePerStep="100us"
      />
      <analogsimulation
        name="retained"
        spiceEngine="retained"
        duration="1ms"
        timePerStep="100us"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const experiments = circuit.db.simulation_experiment.list()
  expect(circuit.db.simulation_unknown_experiment_error.list()).toMatchObject([
    {
      simulation_experiment_id: experiments.find(
        (experiment) => experiment.name === "failed",
      )!.simulation_experiment_id,
      message: "SPICE initialization failed",
    },
  ])
  expect(circuit.db.simulation_dc_operating_point_voltage.list()).toMatchObject(
    [
      {
        simulation_experiment_id: experiments.find(
          (experiment) => experiment.name === "retained",
        )!.simulation_experiment_id,
        voltage: 3,
      },
    ],
  )
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
