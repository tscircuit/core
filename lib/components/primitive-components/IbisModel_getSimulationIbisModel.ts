import type {
  SimulationIbisModelInput,
  SimulationIbisSource,
} from "circuit-json"
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
  let archive: Extract<SimulationIbisSource, { file: string }>["archive"]
  if ("archive" in props.source && props.source.archive) {
    archive = {
      member: props.source.archive.member,
      member_sha256: props.source.archive.memberSha256,
    }
  }
  let source: SimulationIbisSource = props.source
  if ("url" in props.source) {
    source = { url: props.source.url, sha256: props.source.sha256, archive }
  } else if ("file" in props.source) {
    source = { file: props.source.file, sha256: props.source.sha256, archive }
  }
  for (const pin of [
    ...Object.keys(props.references ?? {}),
    ...Object.keys(props.modelSelections ?? {}),
  ]) {
    if (!Object.hasOwn(props.pinMap, pin)) {
      throw new Error(
        `IBIS pin "${pin}" is referenced but not present in pinMap.`,
      )
    }
  }
  let references: SimulationIbisModelInput["references"]
  if (props.references) {
    references = {}
    for (const [pin, pinReferences] of Object.entries(props.references)) {
      references[pin] = {}
      for (const [role, label] of Object.entries(pinReferences)) {
        if (label === undefined) continue
        let referenceRole = role
        if (role === "powerClamp") referenceRole = "power_clamp"
        if (role === "groundClamp") referenceRole = "ground_clamp"
        Object.assign(references[pin], {
          [referenceRole]: resolveExternalSimulationPort({
            declaration,
            selector: `${props.componentRef} > .${label}`,
          }).source_port_id!,
        })
      }
    }
  }
  return {
    type: "simulation_ibis_model",
    source_component_id: chip.source_component_id!,
    source,
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
    references,
  }
}
