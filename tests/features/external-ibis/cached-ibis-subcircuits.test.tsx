import { expect, test } from "bun:test"
import { getElementId } from "@tscircuit/circuit-json-util"
import { any_circuit_element } from "circuit-json"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function IbisSubcircuit({ name, pcbX }: { name: string; pcbX: number }) {
  return (
    <subcircuit name={name} pcbX={pcbX} _subcircuitCachingEnabled>
      <group name="IO">
        <chip
          name="U1"
          footprint="soic4"
          pinLabels={{ pin1: "DATA", pin2: "VCC", pin3: "GND", pin4: "RX" }}
        />
      </group>
      <ibismodel
        componentRef=".IO > .U1"
        ibisModelAsset={{
          project_relative_path: "models/model.ibs",
          url: "https://example.com/model.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "DATA", "2": "VCC", "3": "GND" }}
        ibisPinNameToModelName={{ "1": "DRIVER_OUT" }}
        ibisPinNameToReferencePortLabels={{
          "1": {
            pullup: "VCC",
            pulldown: "GND",
            powerClamp: "VCC",
            groundClamp: "GND",
            external: "GND",
          },
        }}
        modelValueCorner="maximum"
        includePackageParasitics={false}
      />
      <analog.transientsimulation
        name="switching"
        spiceEngine="pcb_spice"
        duration="20ns"
        timePerStep="20ps"
        ibisPinStates={{
          ".IO > .U1 > .DATA": { isOutput: true, isOutputEnabled: true },
        }}
      />
      <analog.digitalstimulus
        name="data"
        simulationRef=".switching"
        sourcePinRef=".IO > .U1 > .DATA"
        bitDuration="2ns"
        startTime="0ns"
        initialState={0}
        transmittedData={{
          transmissionType: "bits",
          bits: "010011",
          repeat: true,
        }}
      />
      <voltageprobe
        name="probe"
        connectsTo=".IO > .U1 > .DATA"
        referenceTo=".IO > .U1 > .GND"
      />
      <analog.transientsimulation
        name="native"
        spiceEngine="native"
        duration="1ms"
      />
      <voltageprobe
        name="native_probe"
        connectsTo=".IO > .U1 > .RX"
        graphDisplayName="Native"
      />
      <analog.eyediagram
        name="eye"
        simulationRef=".switching"
        probeRef=".probe"
        unitInterval="2ns"
        timeOrigin="0ns"
      />
    </subcircuit>
  )
}

test("cached IBIS subcircuits preserve simulation records and remap every reference", async () => {
  let solverCalls = 0
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        native: {
          async simulate(): Promise<{ simulationResultCircuitJson: never[] }> {
            throw new Error("Native solver failed")
          },
        },
        pcb_spice: {
          async simulate() {
            solverCalls++
            throw new Error("External simulation must not run during rendering")
          },
        },
      },
    },
  })
  circuit.add(
    <board width={30} height={15} routingDisabled>
      <IbisSubcircuit name="S1" pcbX={-7} />
      <IbisSubcircuit name="S2" pcbX={7} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.cachedSubcircuits?.size).toBe(1)
  const cachedJson = [...circuit.cachedSubcircuits!.values()][0]
  expect(
    cachedJson.filter((record) => record.type === "simulation_ibis_model"),
  ).toHaveLength(1)
  expect(
    cachedJson.filter((record) => record.type === "simulation_experiment"),
  ).toHaveLength(2)
  expect(
    cachedJson.filter((record) => record.type === "simulation_voltage_probe"),
  ).toHaveLength(2)
  expect(
    cachedJson.some(
      (record) => record.type === "simulation_unknown_experiment_error",
    ),
  ).toBe(true)
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
  expect(circuit.db.simulation_oscilloscope_trace.list()).toHaveLength(0)
  const models = circuit.db.simulation_ibis_model.list()
  expect(models).toHaveLength(2)
  const experiments = circuit.db.simulation_experiment.list()
  const states = circuit.db.simulation_ibis_pin_state.list()
  const stimuli = circuit.db.simulation_digital_stimulus.list()
  const probes = circuit.db.simulation_voltage_probe.list()
  const eyes = circuit.db.simulation_eye_diagram.list()
  for (const records of [models, experiments, states, stimuli, probes, eyes]) {
    expect(records).toHaveLength(2)
    expect(new Set(records.map(getElementId)).size).toBe(2)
  }
  expect(new Set(models.map((model) => model.source_component_id)).size).toBe(2)
  for (const model of models) {
    const ports = model.ibis_pin_name_to_source_port_id
    const data = circuit.db.source_port.get(ports["1"])!
    expect(data.source_component_id).toBe(model.source_component_id)
    for (const sourcePortId of Object.values(ports))
      expect(
        circuit.db.source_port.get(sourcePortId)?.source_component_id,
      ).toBe(model.source_component_id)
    expect(model.ibis_pin_name_to_reference_source_port_ids?.["1"]).toEqual({
      pullup_reference_source_port_id: ports["2"],
      pulldown_reference_source_port_id: ports["3"],
      power_clamp_reference_source_port_id: ports["2"],
      ground_clamp_reference_source_port_id: ports["3"],
      external_reference_source_port_id: ports["3"],
    })
    expect(model.ibis_pin_name_to_model_name).toEqual({ "1": "DRIVER_OUT" })
    expect(model.model_value_corner).toBe("maximum")
    expect(model.include_package_parasitics).toBe(false)
    const state = states.find(
      (state) => state.source_port_id === data.source_port_id,
    )!
    expect(state.is_output).toBe(true)
    expect(state.is_output_enabled).toBe(true)
    const experiment = experiments.find(
      (experiment) =>
        experiment.simulation_experiment_id === state.simulation_experiment_id,
    )!
    expect(experiment.subcircuit_id).toBe(data.subcircuit_id)
    const stimulus = stimuli.find(
      (stimulus) => stimulus.source_port_id === data.source_port_id,
    )!
    expect(stimulus.simulation_experiment_id).toBe(
      experiment.simulation_experiment_id,
    )
    expect(stimulus.bit_duration_ms).toBeCloseTo(0.000002, 14)
    expect(stimulus.transmission_pattern).toEqual({
      transmission_type: "bits",
      bits: "010011",
      repeat: true,
    })
    const probe = probes.find(
      (probe) => probe.signal_input_source_port_id === data.source_port_id,
    )!
    expect(probe.reference_input_source_port_id).toBe(ports["3"])
    expect(probe.subcircuit_id).toBe(data.subcircuit_id)
    const eye = eyes.find(
      (eye) =>
        eye.simulation_voltage_probe_id === probe.simulation_voltage_probe_id,
    )!
    expect(eye.simulation_experiment_id).toBe(
      experiment.simulation_experiment_id,
    )
    expect(eye.unit_interval_ms).toBeCloseTo(0.000002, 14)
  }
  for (const record of circuit
    .getCircuitJson()
    .filter((record) => record.type.startsWith("simulation_")))
    expect(any_circuit_element.safeParse(record).success).toBe(true)
  expect(solverCalls).toBe(0)
})
