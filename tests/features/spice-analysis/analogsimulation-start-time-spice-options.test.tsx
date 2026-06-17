import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"

test("analogsimulation emits start time and spice options", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    },
  })

  circuit.add(
    <board schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="4.2V" />
      <resistor
        name="R_LOAD"
        resistance="82.5"
        connections={{ pin1: "V1.pin1", pin2: "V1.pin2" }}
      />
      <voltageprobe name="VOUT_PROBE" connectsTo=".R_LOAD > .pin1" />
      <analogsimulation
        duration="715.56us"
        startTime="697.58us"
        timePerStep="5ns"
        spiceEngine="ngspice"
        spiceOptions={{
          method: "gear",
          reltol: 0.01,
          abstol: "1n",
          vntol: "1u",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const simulationExperiment = circuit.db.simulation_experiment.list()[0]
  expect(simulationExperiment.end_time_ms).toBeCloseTo(0.71556)
  expect(simulationExperiment.start_time_ms).toBeCloseTo(0.69758)
  expect(simulationExperiment.time_per_step).toBeCloseTo(0.000005)
  expect(simulationExperiment.spice_options).toEqual({
    method: "gear",
    reltol: 0.01,
    abstol: "1n",
    vntol: "1u",
  })
  expect(
    circuit
      .getCircuitJson()
      .some((el) => el.type === "simulation_transient_voltage_graph"),
  ).toBe(true)
  const graph = circuit
    .getCircuitJson()
    .find((el) => el.type === "simulation_transient_voltage_graph")
  expect(graph?.start_time_ms).toBeCloseTo(0.69758)
  expect(graph?.end_time_ms).toBeCloseTo(0.71556)

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
