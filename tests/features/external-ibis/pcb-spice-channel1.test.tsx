import { expect, test } from "bun:test"
import { getPcbSpiceChannelFixture } from "tests/fixtures/get-pcb-spice-channel-fixture"
import { any_circuit_element } from "circuit-json"

test("PCB SPICE exports resolved channel settings", async () => {
  const {
    circuit,
    driverPort,
    receiverPort,
    groundPort,
    termination,
    experiment,
  } = await getPcbSpiceChannelFixture()
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
  expect(any_circuit_element.parse(experiment)).toEqual(experiment)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
