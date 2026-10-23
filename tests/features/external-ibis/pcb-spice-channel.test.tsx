import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import type { AnalogTransientSimulation } from "lib/components/primitive-components/AnalogTransientSimulation"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB SPICE exports resolved channel settings, IBIS digest and connected simulation supply", async () => {
  const { circuit } = getTestFixture()
  const sha256 = "Ab01".repeat(16)
  circuit.add(
    <board width="30mm" height="15mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic4"
        pcbX={-7}
        pinLabels={{ pin1: "DATA", pin2: "GND" }}
      />
      <chip
        name="U2"
        footprint="soic4"
        pcbX={7}
        pinLabels={{ pin1: "DATA", pin2: "GND" }}
      />
      <resistor name="RTERM" footprint="0402" resistance="50" pcbY={-4} />
      <trace from=".U1 > .DATA" to=".U2 > .DATA" />
      <voltagesource
        name="V1"
        voltage="1.5V"
        connections={{ pin1: ".U1 > .pin1", pin2: ".U1 > .pin2" }}
      />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/chip.ibs",
          url: "models/chip.ibs",
          mimetype: "text/plain",
          sha256,
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "DATA" }}
        modelValueCorner="typical"
        includePackageParasitics={false}
      />
      <analog.transientsimulation
        name="channel"
        spiceEngine="pcb_spice"
        duration="20ns"
        pcbSpiceChannel={{
          reduction: "straightened-stages",
          sections: 8,
          lanes: [{ name: "DQ0", from: ".U1 > .DATA", to: ".U2 > .pin1" }],
          referencePinRef: ".U1 > .GND",
          passiveComponentRefs: [".RTERM"],
          extraction: {
            minimumFrequency: "1Hz",
            maximumFrequency: "1GHz",
            modelFrequency: "100MHz",
            filaments: 2,
            refinementFilaments: 4,
            convergenceTolerance: 0.01,
            capacitanceTolerance: 0.02,
            reciprocityTolerance: 0.03,
            dcResistanceTolerance: 0.04,
            maxPanelLength: "0.1mm",
            groundMeshSize: "0.5mm",
          },
          relativePermittivity: 4.2,
          via: {
            platingThickness: "25um",
            equivalentWidth: "0.3mm",
            omitThroughViaStubs: true,
          },
          straightenedStageProfiles: {
            top: {
              spacing: "0.2mm",
              relativePermittivity: 4,
              return: {
                width: "1mm",
                thickness: "35um",
                lengthFactor: 1.1,
                centerY: "-0.2mm",
                centerZ: 0,
              },
            },
          },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const driver = circuit.db.source_component.getWhere({ name: "U1" })!
  const receiver = circuit.db.source_component.getWhere({ name: "U2" })!
  const termination = circuit.db.source_component.getWhere({ name: "RTERM" })!
  const supply = circuit.db.source_component.getWhere({ name: "V1" })!
  const driverPort = circuit.db.source_port.getWhere({
    source_component_id: driver.source_component_id,
    pin_number: 1,
  })!
  const receiverPort = circuit.db.source_port.getWhere({
    source_component_id: receiver.source_component_id,
    pin_number: 1,
  })!
  const groundPort = circuit.db.source_port.getWhere({
    source_component_id: driver.source_component_id,
    pin_number: 2,
  })!
  const experiment = circuit.db.simulation_experiment.list()[0]
  expect(experiment.pcb_spice_channel).toEqual({
    reduction: "straightened-stages",
    sections: 8,
    lanes: [
      {
        name: "DQ0",
        driver_source_port_id: driverPort.source_port_id,
        receiver_source_port_id: receiverPort.source_port_id,
      },
    ],
    reference_source_port_id: groundPort.source_port_id,
    passive_source_component_ids: [termination.source_component_id],
    extraction: {
      minimum_frequency_hz: 1,
      maximum_frequency_hz: 1e9,
      model_frequency_hz: 1e8,
      filaments: 2,
      refinement_filaments: 4,
      convergence_tolerance: 0.01,
      capacitance_tolerance: 0.02,
      reciprocity_tolerance: 0.03,
      dc_resistance_tolerance: 0.04,
      max_panel_length_mm: 0.1,
      ground_mesh_size_mm: 0.5,
    },
    relative_permittivity: 4.2,
    via_plating_thickness_mm: 0.025,
    via_equivalent_width_mm: 0.3,
    omit_through_via_stubs: true,
    straightened_stage_profiles: {
      top: {
        spacing_mm: 0.2,
        relative_permittivity: 4,
        return: {
          width_mm: 1,
          thickness_mm: 0.035,
          length_factor: 1.1,
          center_y_mm: -0.2,
          center_z_mm: 0,
        },
      },
    },
  })
  expect(
    circuit.db.simulation_ibis_model.list()[0].ibis_model_asset.sha256,
  ).toBe(sha256)
  const voltageSource = circuit.db.simulation_voltage_source.list()[0]
  const terminal1 = circuit.db.source_port.getWhere({
    source_component_id: supply.source_component_id,
    pin_number: 1,
  })!
  const terminal2 = circuit.db.source_port.getWhere({
    source_component_id: supply.source_component_id,
    pin_number: 2,
  })!
  expect(voltageSource).toMatchObject({
    type: "simulation_voltage_source",
    voltage: 1.5,
    is_dc_source: false,
    terminal1_source_port_id: terminal1.source_port_id,
    terminal2_source_port_id: terminal2.source_port_id,
  })
  expect(terminal1.source_port_id).not.toBe(driverPort.source_port_id)
  for (const [terminal, chipPort] of [
    [terminal1, driverPort],
    [terminal2, groundPort],
  ]) {
    expect(
      circuit.db.source_trace
        .list()
        .some(
          (trace) =>
            trace.connected_source_port_ids.length === 2 &&
            trace.connected_source_port_ids.includes(terminal.source_port_id) &&
            trace.connected_source_port_ids.includes(chipPort.source_port_id),
        ),
    ).toBe(true)
  }
  expect(
    circuit.db.pcb_component.getWhere({
      source_component_id: supply.source_component_id,
    }),
  ).toBeNull()
  expect(any_circuit_element.parse(experiment)).toEqual(experiment)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const simulation = circuit.selectOne(".channel") as AnalogTransientSimulation
  simulation.setProps({
    ...simulation.props,
    pcbSpiceChannel: {
      ...simulation.props.pcbSpiceChannel!,
      reduction: "routed-copper",
      sections: 128,
    },
  })
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_experiment.list()).toHaveLength(1)
  expect(circuit.db.simulation_experiment.list()[0]).toMatchObject({
    simulation_experiment_id: experiment.simulation_experiment_id,
    pcb_spice_channel: { reduction: "routed-copper", sections: 128 },
  })
  simulation.setProps({ ...simulation.props, pcbSpiceChannel: undefined })
  await circuit.renderUntilSettled()
  expect(
    circuit.db.simulation_experiment.list()[0].pcb_spice_channel,
  ).toBeUndefined()
})
