import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { analog } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("transient measurements read voltage and current results for every sweep run", async () => {
  let runCount = 0
  const fakeEngine: SpiceEngine = {
    async simulate(spiceString) {
      runCount++
      const voltageProbeMappings = spiceString
        .split("\n")
        .filter((line) => line.startsWith("* tscircuit_probe "))
        .map(
          (line) =>
            JSON.parse(line.slice("* tscircuit_probe ".length)) as {
              simulation_voltage_probe_id: string
              name: string
            },
        )
      return {
        simulationResultCircuitJson: [
          ...voltageProbeMappings.map((probe) => ({
            type: "simulation_transient_voltage_graph",
            simulation_transient_voltage_graph_id: `voltage_result_${probe.simulation_voltage_probe_id}`,
            simulation_experiment_id: "fake",
            name: probe.name,
            source_probe_id: probe.simulation_voltage_probe_id,
            timestamps_ms: [0, 1, 2],
            voltage_levels: [3.2, 3.25, 3.3 + runCount / 100],
            time_per_step: 1,
            start_time_ms: 0,
            end_time_ms: 2,
          })),
          {
            type: "simulation_transient_current_graph",
            simulation_transient_current_graph_id: "current_result",
            simulation_experiment_id: "fake",
            name: "IIN",
            timestamps_ms: [0, 1, 2],
            current_levels: [0.1, 0.2, runCount],
            time_per_step: 1,
            start_time_ms: 0,
            end_time_ms: 2,
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
      <voltagesource name="VIN" voltage="5V" />
      <ammeter
        name="IIN"
        connections={{ pos: ".VIN > .pin2", neg: "net.VOUT" }}
      />
      <resistor name="RLOAD" resistance="1k" />
      <trace from=".VIN > .pin1" to="net.GND" />
      <trace from=".RLOAD > .pin1" to="net.VOUT" />
      <trace from=".RLOAD > .pin2" to="net.GND" />
      <analog.transientsimulation
        name="measured-load"
        duration="2ms"
        timePerStep="1ms"
        spiceEngine="fake"
      >
        <analog.sweepparameter
          parameterType="resistance"
          resistorRef=".RLOAD"
          values={["1kΩ", "2kΩ"]}
        />
        <analog.measurement
          name="settled-output-voltage"
          unit="V"
          measureFn={({ getVoltage }) =>
            getVoltage("net.VOUT").values.at(-1) ?? Number.NaN
          }
        />
        <analog.measurement
          name="settled-input-current"
          unit="A"
          measureFn={({ getCurrent }) =>
            getCurrent(".IIN").values.at(-1) ?? Number.NaN
          }
        />
      </analog.transientsimulation>
    </board>,
  )

  await circuit.renderUntilSettled()

  const measurementResults = circuit.db.simulation_measurement_result.list()
  expect(measurementResults).toHaveLength(2)
  expect(
    measurementResults[0]?.measurement_values.map((value) =>
      Number(value.toFixed(2)),
    ),
  ).toEqual([3.31, 3.32])
  expect(measurementResults[1]?.measurement_values).toEqual([1, 2])
  expect(
    measurementResults[0]?.simulation_parameter_sweep_coordinate_sets?.map(
      (coordinateSet) => coordinateSet[0]?.parameter_value,
    ),
  ).toEqual([1000, 2000])
  expect(circuit.db.simulation_transient_voltage_graph.list()).toHaveLength(0)
  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})

test("explicit voltage probes are not shadowed by implicit measurement probes", async () => {
  let voltageProbeMappings: Array<{
    simulation_voltage_probe_id: string
    name: string
    spice_vector: string
  }> = []
  const fakeEngine: SpiceEngine = {
    async simulate(spiceString) {
      voltageProbeMappings = spiceString
        .split("\n")
        .filter((line) => line.startsWith("* tscircuit_probe "))
        .map(
          (line) =>
            JSON.parse(line.slice("* tscircuit_probe ".length)) as {
              simulation_voltage_probe_id: string
              name: string
              spice_vector: string
            },
        )
      const probeBySpiceVector = new Map(
        voltageProbeMappings.map((probe) => [probe.spice_vector, probe]),
      )

      return {
        simulationResultCircuitJson: [...probeBySpiceVector.values()].map(
          (probe) => ({
            type: "simulation_transient_voltage_graph",
            simulation_transient_voltage_graph_id: `voltage_result_${probe.simulation_voltage_probe_id}`,
            simulation_experiment_id: "fake",
            name: probe.name,
            source_probe_id: probe.simulation_voltage_probe_id,
            timestamps_ms: [0, 1],
            voltage_levels: [3.3, 3.3],
            time_per_step: 1,
            start_time_ms: 0,
            end_time_ms: 1,
          }),
        ),
      }
    },
  }
  const { circuit } = getTestFixture({
    platform: { spiceEngineMap: { fake: fakeEngine } },
  })

  circuit.add(
    <board routingDisabled>
      <voltagesource name="VIN" voltage="5V" />
      <resistor name="RLOAD" resistance="1k" />
      <trace from=".VIN > .pin1" to=".RLOAD > .pin1" />
      <trace from=".VIN > .pin2" to=".RLOAD > .pin2" schDisplayLabel="GND" />
      <voltageprobe name="VOUT" connectsTo=".RLOAD > .pin1" />
      <analog.transientsimulation
        name="measured-output"
        duration="1ms"
        timePerStep="1ms"
        spiceEngine="fake"
      >
        <analog.measurement
          name="output-voltage"
          unit="V"
          measureFn={({ getVoltage }) =>
            getVoltage(".VIN > .pin1").values.at(-1) ?? Number.NaN
          }
        />
      </analog.transientsimulation>
    </board>,
  )

  await circuit.renderUntilSettled()

  const outputVoltageProbeId =
    circuit.db.simulation_voltage_probe.list()[0]?.simulation_voltage_probe_id
  const outputVoltageProbeMapping = voltageProbeMappings.find(
    (probe) => probe.simulation_voltage_probe_id === outputVoltageProbeId,
  )
  expect(outputVoltageProbeMapping).toBeDefined()
  expect(
    voltageProbeMappings.filter(
      (probe) => probe.spice_vector === outputVoltageProbeMapping?.spice_vector,
    ),
  ).toHaveLength(1)
  expect(
    circuit.db.simulation_measurement_result.list()[0]?.measurement_values,
  ).toEqual([3.3])
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
})
