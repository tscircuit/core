import type { PcbSpiceChannel } from "circuit-json"
import type { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import type { AnalogTransientSimulation } from "./AnalogTransientSimulation"

export function AnalogTransientSimulation_getPcbSpiceChannel(
  declaration: AnalogTransientSimulation,
): PcbSpiceChannel | undefined {
  if (declaration.getInheritedProperty("analogSimulationDisabled")) return
  const channel = declaration._parsedProps.pcbSpiceChannel
  if (!channel) return
  const resolvePort = (selector: string) =>
    resolveExternalSimulationPort({ declaration, selector }).source_port_id!
  const extraction = channel.extraction
  return {
    reduction: channel.reduction,
    sections: channel.sections,
    lanes: channel.lanes.map((lane) => ({
      name: lane.name,
      driver_source_port_id: resolvePort(lane.from),
      receiver_source_port_id: resolvePort(lane.to),
    })),
    reference_source_port_id: resolvePort(channel.referencePinRef),
    passive_source_component_ids: channel.passiveComponentRefs?.map(
      (selector) => {
        const components = declaration
          .getSubcircuit()
          .selectAll<NormalComponent>(selector)
          .filter((component) => component.source_component_id)
        if (
          components.length !== 1 ||
          components[0].getSubcircuit() !== declaration.getSubcircuit()
        ) {
          throw new Error(
            `PCB SPICE passive component selector "${selector}" must identify one component in this subcircuit.`,
          )
        }
        return components[0].source_component_id!
      },
    ),
    extraction: {
      minimum_frequency_hz: extraction.minimumFrequency,
      maximum_frequency_hz: extraction.maximumFrequency,
      model_frequency_hz: extraction.modelFrequency,
      filaments: extraction.filaments,
      refinement_filaments: extraction.refinementFilaments,
      convergence_tolerance: extraction.convergenceTolerance,
      capacitance_tolerance: extraction.capacitanceTolerance,
      reciprocity_tolerance: extraction.reciprocityTolerance,
      dc_resistance_tolerance: extraction.dcResistanceTolerance,
      max_panel_length_mm: extraction.maxPanelLength,
      ground_mesh_size_mm: extraction.groundMeshSize,
    },
    relative_permittivity: channel.relativePermittivity,
    via_plating_thickness_mm: channel.via?.platingThickness,
    via_equivalent_width_mm: channel.via?.equivalentWidth,
    omit_through_via_stubs: channel.via?.omitThroughViaStubs,
    straightened_stage_profiles:
      channel.straightenedStageProfiles &&
      Object.fromEntries(
        Object.entries(channel.straightenedStageProfiles).map(
          ([layer, profile]) => [
            layer,
            {
              spacing_mm: profile.spacing,
              relative_permittivity: profile.relativePermittivity,
              return: {
                width_mm: profile.return.width,
                thickness_mm: profile.return.thickness,
                length_factor: profile.return.lengthFactor,
                center_y_mm: profile.return.centerY,
                center_z_mm: profile.return.centerZ,
              },
            },
          ],
        ),
      ),
  }
}
