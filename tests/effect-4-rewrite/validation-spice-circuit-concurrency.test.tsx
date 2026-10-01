import { expect, test } from "bun:test"
import type { SpiceEngineSimulationResult } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simulation child removal preserves another circuit job and ignores a late rejected engine result", async () => {
  const started = Promise.withResolvers<void>()
  const first = Promise.withResolvers<SpiceEngineSimulationResult>()
  const second = Promise.withResolvers<SpiceEngineSimulationResult>()
  let calls = 0
  const { circuit } = getTestFixture({
    platform: {
      pcbDisabled: true,
      schematicDisabled: true,
      drcChecksDisabled: true,
      spiceEngineMap: {
        fake: {
          simulate: () => {
            calls++
            if (calls === 2) started.resolve()
            return calls === 1 ? first.promise : second.promise
          },
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
        name="removed"
        spiceEngine="fake"
        duration="1ms"
        timePerStep="100us"
      />
      <analogsimulation
        name="retained"
        spiceEngine="fake"
        duration="2ms"
        timePerStep="200us"
      />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  await started.promise
  const removed = circuit.selectOne("analogsimulation.removed")!
  removed.parent!.remove(removed)
  expect(circuit.effectRuntime.activeJobCount).toBe(1)
  first.reject(new Error("late removed simulation failure"))
  second.resolve({
    simulationResultCircuitJson: [
      {
        type: "simulation_dc_operating_point_voltage",
        simulation_dc_operating_point_voltage_id: "retained-result",
        simulation_experiment_id: "fake",
        simulation_voltage_probe_id: "fake-probe",
        voltage: 5,
      },
    ],
  })
  await settled
  const experiment = circuit.db.simulation_experiment
    .list()
    .find((experiment) => experiment.name === "retained")!
  expect(circuit.db.simulation_dc_operating_point_voltage.list()).toMatchObject(
    [
      {
        simulation_experiment_id: experiment.simulation_experiment_id,
        voltage: 5,
      },
    ],
  )
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
  expect(calls).toBe(2)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
