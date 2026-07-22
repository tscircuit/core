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
      <voltagesource name="V1" voltage="5V" />
      <resistor
        name="R1"
        resistance="1k"
        connections={{ pin1: ".V1 > .pin1", pin2: ".V1 > .pin2" }}
      />
      <voltageprobe name="VOUT" connectsTo=".R1 > .pin1" />
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

  const sweepPoints = circuit.db.simulation_parameter_sweep_point.list()
  const results = circuit.db.simulation_dc_operating_point_voltage.list()
  expect(sweepPoints.map((sweepPoint) => sweepPoint.parameter_value)).toEqual([
    100, 200, 300,
  ])
  expect(spiceStrings).toHaveLength(3)
  expect(
    spiceStrings.map(
      (spiceString) => spiceString.match(/^RR1 .+ (\d+)$/m)?.[1],
    ),
  ).toEqual(["100", "200", "300"])
  expect(
    results.map((result) => result.simulation_parameter_sweep_point_id),
  ).toEqual(
    sweepPoints.map(
      (sweepPoint) => sweepPoint.simulation_parameter_sweep_point_id,
    ),
  )
  expect(results.map((result) => result.voltage)).toEqual([1, 2, 3])
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
})
