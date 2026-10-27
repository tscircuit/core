import type { SimulationIbisModelInput } from "circuit-json"
import type { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import type { IbisModel } from "./IbisModel"

type SourcePortId =
  SimulationIbisModelInput["ibis_pin_name_to_source_port_id"][string]

export function IbisModel_getSimulationIbisModel(
  declaration: IbisModel,
): SimulationIbisModelInput {
  const props = declaration._parsedProps
  const chips = declaration
    .getSubcircuit()
    .selectAll<NormalComponent>(props.componentRef)
    .filter((chip) => chip.source_component_id)
  if (
    chips.length !== 1 ||
    chips[0].getSubcircuit() !== declaration.getSubcircuit()
  ) {
    throw new Error(
      `IBIS component selector "${props.componentRef}" must identify one component in this subcircuit.`,
    )
  }
  const chip = chips[0]
  if (
    declaration
      .root!.db.simulation_ibis_model.list({
        source_component_id: chip.source_component_id!,
      })
      .some(
        (model) =>
          model.simulation_ibis_model_id !==
          declaration.simulation_ibis_model_id,
      )
  ) {
    throw new Error(
      `Component "${props.componentRef}" already has an IBIS model.`,
    )
  }
  const pinMap = Object.fromEntries(
    Object.entries(props.ibisPinNameToPortLabel).map(([pin, label]) => [
      pin,
      resolveExternalSimulationPort({
        declaration,
        selector: `${props.componentRef} > .${label}`,
      }).source_port_id!,
    ]),
  )
  const ibisPinNameBySourcePortId = new Map<SourcePortId, string>()
  for (const [pin, sourcePortId] of Object.entries(pinMap)) {
    const previousPin = ibisPinNameBySourcePortId.get(sourcePortId)
    if (previousPin !== undefined) {
      throw new Error(
        `IBIS pins "${previousPin}" and "${pin}" on "${props.componentRef}" resolve to the same physical pin.`,
      )
    }
    ibisPinNameBySourcePortId.set(sourcePortId, pin)
  }
  for (const pin of [
    ...Object.keys(props.ibisPinNameToReferencePortLabels ?? {}),
    ...Object.keys(props.ibisPinNameToModelName ?? {}),
  ]) {
    if (!Object.hasOwn(props.ibisPinNameToPortLabel, pin)) {
      throw new Error(
        `IBIS pin "${pin}" is referenced but not present in ibisPinNameToPortLabel.`,
      )
    }
  }
  let references: SimulationIbisModelInput["ibis_pin_name_to_reference_source_port_ids"]
  if (props.ibisPinNameToReferencePortLabels) {
    references = {}
    for (const [pin, pinReferences] of Object.entries(
      props.ibisPinNameToReferencePortLabels,
    )) {
      references[pin] = {}
      for (const [role, sourcePortIdField] of [
        ["pullup", "pullup_reference_source_port_id"],
        ["pulldown", "pulldown_reference_source_port_id"],
        ["powerClamp", "power_clamp_reference_source_port_id"],
        ["groundClamp", "ground_clamp_reference_source_port_id"],
        ["external", "external_reference_source_port_id"],
      ] as const) {
        const label = pinReferences[role]
        if (label === undefined) continue
        references[pin][sourcePortIdField] = resolveExternalSimulationPort({
          declaration,
          selector: `${props.componentRef} > .${label}`,
        }).source_port_id!
      }
    }
  }
  return {
    type: "simulation_ibis_model",
    source_component_id: chip.source_component_id!,
    ibis_model_asset: props.ibisModelAsset,
    ibis_component_name: props.ibisComponentName,
    model_value_corner: props.modelValueCorner,
    include_package_parasitics: props.includePackageParasitics,
    ibis_pin_name_to_model_name: props.ibisPinNameToModelName,
    ibis_pin_name_to_source_port_id: pinMap,
    ibis_pin_name_to_reference_source_port_ids: references,
  }
}
