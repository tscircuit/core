import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import type { SpiceEngineSimulationOptions } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("DC operating-point analysis returns scalar probe values", async () => {
  let capturedSpice = ""
  let capturedOptions: SpiceEngineSimulationOptions | undefined
  const ngspiceEngine = await createNgspiceSpiceEngine()
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: {
          async simulate(
            spiceString: string,
            options?: SpiceEngineSimulationOptions,
          ) {
            capturedSpice = spiceString
            capturedOptions = options
            return ngspiceEngine.simulate(spiceString, options)
          },
        },
      },
    },
  })

  circuit.add(
    <board routingDisabled>
      <voltagesource name="V1" voltage="5V" />
      <ammeter
        name="I_LOAD"
        connections={{ pos: ".V1 > .pin1", neg: ".R1 > .pin1" }}
      />
      <resistor name="R1" resistance="1k" />
      <resistor name="R2" resistance="1k" />
      <chip name="U_BOUNDARY" simulationBoundary />

      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".V1 > .pin2" />

      <voltageprobe name="VIN" connectsTo=".V1 > .pin1" />
      <voltageprobe name="VOUT" connectsTo=".R1 > .pin2" />
      <analogsimulation
        name="bias"
        simulationType="spice_dc_operating_point"
        timeout="5s"
        spiceEngine="ngspice"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const experiment = circuit.db.simulation_experiment.list()[0]!
  expect(experiment).toMatchObject({
    name: "bias",
    experiment_type: "spice_dc_operating_point",
    timeout_ms: 5000,
  })
  expect(experiment.end_time_ms).toBeUndefined()
  expect(capturedOptions).toEqual({ timeoutMs: 5000 })
  expect(capturedSpice).toContain(".PRINT OP")
  expect(capturedSpice).toContain(".op")
  expect(capturedSpice).not.toContain(".tran")
  expect(capturedSpice).not.toContain("UIC")

  const voltages = circuit.db.simulation_operating_point_voltage.list()
  const currents = circuit.db.simulation_operating_point_current.list()
  expect(voltages).toHaveLength(2)
  expect(currents).toHaveLength(1)
  expect(
    voltages.find((measurement) => measurement.name === "VIN")?.voltage,
  ).toBeCloseTo(5)
  expect(
    voltages.find((measurement) => measurement.name === "VOUT")?.voltage,
  ).toBeCloseTo(2.5)
  expect(Math.abs(currents[0]!.current)).toBeCloseTo(0.0025)
  expect(
    [...voltages, ...currents].every(
      (measurement) =>
        measurement.simulation_experiment_id ===
        experiment.simulation_experiment_id,
    ),
  ).toBe(true)
  expect(circuit.db.simulation_experiment_error.list()).toHaveLength(0)
  expect(
    circuit.db.source_component
      .list()
      .find((component) => component.name === "U_BOUNDARY"),
  ).toMatchObject({ is_simulation_boundary: true })

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
}, 20_000)
