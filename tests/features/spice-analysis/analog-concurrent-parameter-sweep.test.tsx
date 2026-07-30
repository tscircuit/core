import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { analog } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("analog parameter sweeps honor engine simulation concurrency", async () => {
  let activeSimulationCount = 0
  let maximumActiveSimulationCount = 0
  const completionOrder: number[] = []
  const fakeEngine: SpiceEngine & { maxConcurrentSimulations: number } = {
    maxConcurrentSimulations: 2,
    async simulate(spiceString) {
      const resistance = Number(spiceString.match(/^RR1 .+ (\d+)$/m)?.[1])
      activeSimulationCount++
      maximumActiveSimulationCount = Math.max(
        maximumActiveSimulationCount,
        activeSimulationCount,
      )
      await Bun.sleep(resistance === 100 ? 400 : 50)
      completionOrder.push(resistance)
      activeSimulationCount--
      return {
        simulationResultCircuitJson: [
          {
            type: "simulation_dc_operating_point_voltage",
            simulation_dc_operating_point_voltage_id: "result",
            simulation_experiment_id: "fake",
            simulation_voltage_probe_id: "fake_probe",
            voltage: resistance,
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
          values={["100Ω", "200Ω", "300Ω", "400Ω"]}
        />
      </analog.dcoperatingpointsimulation>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(maximumActiveSimulationCount).toBe(2)
  expect(completionOrder).toEqual([200, 300, 400, 100])
  expect(
    circuit.db.simulation_dc_operating_point_voltage
      .list()
      .map((result) => result.voltage),
  ).toEqual([100, 200, 300, 400])
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
