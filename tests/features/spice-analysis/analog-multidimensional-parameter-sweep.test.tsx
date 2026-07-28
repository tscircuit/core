import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { analog } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multiple parameter sweeps execute their Cartesian product in child order", async () => {
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
            name: "VOUT",
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
      <net name="GND" isGroundNet />
      <net name="VOUT" />
      <voltagesource name="V1" voltage="5V" />
      <resistor name="R1" resistance="1k" />
      <capacitor name="C1" capacitance="1uF" />
      <trace from=".V1 > .pin1" to="net.GND" />
      <trace from=".V1 > .pin2" to="net.VOUT" />
      <trace from=".R1 > .pin1" to="net.VOUT" />
      <trace from=".R1 > .pin2" to="net.GND" />
      <trace from=".C1 > .pin1" to="net.VOUT" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <voltageprobe name="VOUT" connectsTo=".R1 > .pin1" />
      <analog.dcoperatingpointsimulation name="sweep" spiceEngine="fake">
        <analog.sweepparameter
          name="load-resistance"
          parameterType="resistance"
          resistorRef=".R1"
          values={["100Ω", "200Ω"]}
        />
        <analog.sweepparameter
          name="output-capacitance"
          parameterType="capacitance"
          capacitorRef=".C1"
          values={["1uF", "2uF", "3uF"]}
        />
      </analog.dcoperatingpointsimulation>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    spiceStrings.map((spiceString) => [
      Number(spiceString.match(/^RR1 .+ (\d+)$/m)?.[1]),
      spiceString.match(/^CC1 .+ (\w+)$/m)?.[1],
    ]),
  ).toEqual([
    [100, "1U"],
    [100, "2U"],
    [100, "3U"],
    [200, "1U"],
    [200, "2U"],
    [200, "3U"],
  ])
  expect(
    circuit.db.simulation_dc_operating_point_voltage
      .list()
      .map((result) =>
        result.simulation_parameter_sweep_coordinates?.map(
          (coordinate) => coordinate.parameter_value,
        ),
      ),
  ).toEqual([
    [100, 1e-6],
    [100, 2e-6],
    [100, 3e-6],
    [200, 1e-6],
    [200, 2e-6],
    [200, 3e-6],
  ])
  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
