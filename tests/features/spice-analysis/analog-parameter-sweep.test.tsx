import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { analog } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("analog parameter sweeps execute one run per ordered sweep point", async () => {
  const spiceStrings: string[] = []
  const fakeEngine: SpiceEngine = {
    async simulate(spiceString) {
      spiceStrings.push(spiceString)
      return {
        simulationResultCircuitJson: [
          {
            type: "simulation_dc_operating_point_voltage",
            simulation_dc_operating_point_voltage_id: "result",
            simulation_experiment_id: "fake",
            simulation_voltage_probe_id: "fake_probe",
            voltage: spiceStrings.length,
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
        name="R1"
        resistance="1k"
        schX={1.5}
        schY={0}
        schRotation={180}
      />
      <trace from=".V1 > .pin1" to=".R1 > .pin1" schDisplayLabel="GND" />
      <trace from=".V1 > .pin2" to=".R1 > .pin2" />
      <voltageprobe name="VOUT" connectsTo=".R1 > .pin2" />
      <analog.dcoperatingpointsimulation name="swept-op" spiceEngine="fake">
        <analog.sweepparameter
          parameterType="resistance"
          resistorRef=".R1"
          values={["100Ω", "200Ω", "300Ω"]}
        />
      </analog.dcoperatingpointsimulation>
    </board>,
  )

  await circuit.renderUntilSettled()

  const parameterSweep = circuit.db.simulation_parameter_sweep.list()[0]
  const results = circuit.db.simulation_dc_operating_point_voltage.list()
  expect(parameterSweep?.parameter_values).toEqual([100, 200, 300])
  expect(spiceStrings).toHaveLength(3)
  expect(
    spiceStrings.map(
      (spiceString) => spiceString.match(/^RR1 .+ (\d+)$/m)?.[1],
    ),
  ).toEqual(["100", "200", "300"])
  expect(
    results.map(
      (result) => result.simulation_parameter_sweep_coordinate?.parameter_value,
    ),
  ).toEqual([100, 200, 300])
  expect(
    results.map(
      (result) => result.simulation_parameter_sweep_coordinate?.sweep_index,
    ),
  ).toEqual([0, 1, 2])
  expect(results.map((result) => result.voltage)).toEqual([1, 2, 3])
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
