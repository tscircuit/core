import type { SimulationIbisModelInput } from "circuit-json"
import type { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import type { IbisModel } from "./IbisModel"

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
  const existingModels = declaration.root!.db.simulation_ibis_model.list({
    source_component_id: chip.source_component_id!,
  })
  if (
    existingModels.some(
      (model) =>
        model.simulation_ibis_model_id !== declaration.simulation_ibis_model_id,
    )
  ) {
    throw new Error(
      `Component "${props.componentRef}" already has an IBIS model.`,
    )
  }
  const archive =
    "archive" in props.source && props.source.archive
      ? {
          member: props.source.archive.member,
          member_sha256: props.source.archive.memberSha256,
        }
      : undefined
  return {
    type: "simulation_ibis_model",
    source_component_id: chip.source_component_id!,
    source:
      "url" in props.source
        ? { url: props.source.url, sha256: props.source.sha256, archive }
        : "file" in props.source
          ? { file: props.source.file, sha256: props.source.sha256, archive }
          : props.source,
    component: props.component,
    corner: props.corner,
    package_policy: props.packagePolicy,
    model_selections: props.modelSelections,
    pin_to_source_port_map: Object.fromEntries(
      Object.entries(props.pinMap).map(([pin, label]) => [
        pin,
        resolveExternalSimulationPort({
          declaration,
          selector: `${props.componentRef} > .${label}`,
        }).source_port_id!,
      ]),
    ),
    references: props.references
      ? Object.fromEntries(
          Object.entries(props.references).map(([pin, references]) => [
            pin,
            Object.fromEntries(
              Object.entries(references)
                .filter(([, label]) => label !== undefined)
                .map(([role, label]) => [
                  role === "powerClamp"
                    ? "power_clamp"
                    : role === "groundClamp"
                      ? "ground_clamp"
                      : role,
                  resolveExternalSimulationPort({
                    declaration,
                    selector: `${props.componentRef} > .${label}`,
                  }).source_port_id!,
                ]),
            ),
          ]),
        )
      : undefined,
  }
}
