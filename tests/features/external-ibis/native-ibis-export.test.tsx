import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { any_circuit_element } from "circuit-json"

test("native TSX exports physical IBIS bindings without fetching or running a solver", async () => {
  let solverCalls = 0
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
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
    <board width="30mm" height="15mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic4"
        pinLabels={{ pin1: "DATA", pin2: "VCC", pin3: "GND", pin4: "RX" }}
        pcbX={-7}
      />
      <chip
        name="U2"
        footprint="soic4"
        pinLabels={{ pin1: "DATA", pin2: "VCC", pin3: "GND", pin4: "RX" }}
        pcbX={7}
      />
      <trace from=".U1 > .DATA" to=".U2 > .DATA" />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/model.ibs",
          url: "https://example.com/model.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "DATA", "2": "VCC", "3": "GND" }}
        ibisPinNameToModelName={{ "1": "DRIVER_OUT" }}
        ibisPinNameToReferencePortLabels={{
          "1": { pullup: "VCC", groundClamp: "GND" },
        }}
        modelValueCorner="typical"
        includePackageParasitics={true}
      />
      <analog.eyediagram
        name="data-eye"
        simulationRef=".switching"
        probeRef=".data-probe"
        unitInterval="2ns"
        timeOrigin="0ns"
        startTime="4ns"
        endTime="20ns"
      />
      <analog.digitalstimulus
        name="data"
        simulationRef=".switching"
        sourcePinRef=".U1 > .DATA"
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
        name="data-probe"
        connectsTo=".U2 > .DATA"
        referenceTo=".U2 > .GND"
      />
      <analog.transientsimulation
        spiceEngine="pcb_spice"
        name="switching"
        duration="20ns"
        timePerStep="20ps"
        ibisPinStates={{
          ".U1 > .DATA": { isOutput: true, isOutputEnabled: true },
          ".U2 > .DATA": { isOutput: false },
        }}
      />
      <analog.transientsimulation
        spiceEngine="pcb_spice"
        name="quiet"
        duration="20ns"
        timePerStep="20ps"
        ibisPinStates={{
          ".U1 > .DATA": { isOutput: true, isOutputEnabled: false },
          ".U2 > .DATA": { isOutput: false },
        }}
      />
      <ibismodel
        componentRef=".U2"
        ibisModelAsset={{
          project_relative_path: "models/receiver.ibs",
          url: "https://example.com/receiver.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="RECEIVER"
        ibisPinNameToPortLabel={{ "1": "DATA", "2": "VCC", "3": "GND" }}
        modelValueCorner="typical"
        includePackageParasitics={false}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const models = circuit.db.simulation_ibis_model.list()
  const driver = circuit.db.source_component
    .list()
    .find((component) => component.name === "U1")!
  const receiver = circuit.db.source_component
    .list()
    .find((component) => component.name === "U2")!
  const driverPort = circuit.db.source_port
    .list()
    .find(
      (port) =>
        port.source_component_id === driver.source_component_id &&
        port.pin_number === 1,
    )!
  const receiverPort = circuit.db.source_port
    .list()
    .find(
      (port) =>
        port.source_component_id === receiver.source_component_id &&
        port.pin_number === 1,
    )!
  expect(models).toHaveLength(2)
  const driverModel = models.find(
    (model) => model.source_component_id === driver.source_component_id,
  )!
  expect(driverModel.source_component_id).toBe(driver.source_component_id)
  expect(driverModel.ibis_component_name).toBe("DRIVER")
  expect(driverModel.model_value_corner).toBe("typical")
  expect(driverModel.include_package_parasitics).toBe(true)
  expect(driverModel.ibis_pin_name_to_model_name).toEqual({ "1": "DRIVER_OUT" })
  expect(driverModel.ibis_pin_name_to_source_port_id["1"]).toBe(
    driverPort.source_port_id,
  )
  expect(driverModel.ibis_model_asset).toEqual({
    project_relative_path: "models/model.ibs",
    url: "https://example.com/model.ibs",
    mimetype: "text/plain",
  })
  expect(
    driverModel.ibis_pin_name_to_reference_source_port_ids?.["1"]
      .ground_clamp_reference_source_port_id,
  ).toBe(driverModel.ibis_pin_name_to_source_port_id["3"])
  const experiments = circuit.db.simulation_experiment.list()
  expect(experiments).toHaveLength(2)
  const switching = experiments.find(
    (experiment) => experiment.name === "switching",
  )!
  expect(switching.spice_engine).toBe("pcb_spice")
  expect(switching.subcircuit_id).toBeTruthy()
  expect(switching).not.toHaveProperty("execution_mode")
  expect(switching.end_time_ms).toBeCloseTo(0.00002, 14)
  const states = circuit.db.simulation_ibis_pin_state.list()
  expect(states).toHaveLength(4)
  expect(
    states
      .filter((state) => state.is_output)
      .map((state) => state.is_output_enabled)
      .sort(),
  ).toEqual([false, true])
  const stimulus = circuit.db.simulation_digital_stimulus.list()[0]
  expect(stimulus.simulation_experiment_id).toBe(
    switching.simulation_experiment_id,
  )
  expect(stimulus.source_port_id).toBe(driverPort.source_port_id)
  expect(stimulus.bit_duration_ms).toBeCloseTo(0.000002, 14)
  expect(stimulus.inverted).toBe(false)
  const probes = circuit.db.simulation_voltage_probe.list()
  expect(probes).toHaveLength(1)
  expect(probes[0].signal_input_source_port_id).toBe(
    receiverPort.source_port_id,
  )
  expect(
    circuit.db.simulation_eye_diagram.list()[0].simulation_voltage_probe_id,
  ).toBe(probes[0].simulation_voltage_probe_id)
  expect(circuit.db.simulation_transient_voltage_graph.list()).toHaveLength(0)
  expect(solverCalls).toBe(0)
  for (const record of circuit
    .getCircuitJson()
    .filter((record) => record.type.startsWith("simulation_")))
    expect(any_circuit_element.parse(record)).toEqual(record)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
