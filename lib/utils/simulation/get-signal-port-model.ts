import type { SourcePort } from "circuit-json"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"

export function describeSignalPort(
  block: PcbTransientChannelSimulation,
  port: SourcePort,
) {
  const component = port.source_component_id
    ? block.root!.db.source_component.get(port.source_component_id)
    : undefined
  return `.${component?.name ?? "unnamed component"} > .${port.most_frequently_referenced_by_name ?? port.name}`
}

export function getSignalPortModelInfo(
  block: PcbTransientChannelSimulation,
  portId: SourcePort["source_port_id"],
  override?: string,
) {
  const { db } = block.root!
  const models = db.simulation_ibis_model.list()
  const model = models.find((model) =>
    Object.values(model.ibis_pin_name_to_source_port_id).includes(portId),
  )
  if (!model) return undefined
  const info = block.ibisModelInfoByUrl.get(model.ibis_model_asset.url)!
  const component = info.components.get(model.ibis_component_name)
  const port = db.source_port.get(portId)!
  const label = describeSignalPort(block, port)
  if (!component)
    throw new Error(
      `${label}: IBIS component "${model.ibis_component_name}" was not found.`,
    )
  if (component.coupledPackage) {
    const chip = db.source_component.get(port.source_component_id!)!
    throw new Error(
      `.${chip.name}: coupled [Package Model] not implemented yet; scalar fallback is forbidden.`,
    )
  }
  const pin = Object.entries(model.ibis_pin_name_to_source_port_id).find(
    ([, id]) => id === portId,
  )![0]
  const pinModel = component.pinModels.get(pin)
  const choices =
    info.modelSelectors.get(pinModel!) ?? (pinModel ? [pinModel] : [])
  const selected = override ?? model.ibis_pin_name_to_model_name?.[pin]
  const modelName = selected ?? (choices.length === 1 ? choices[0] : undefined)
  if (!modelName)
    throw new Error(
      `${label}: choose an IBIS model from ${choices.join(", ")}.`,
    )
  if (!choices.includes(modelName) || !info.modelTypes.has(modelName))
    throw new Error(`${label}: selected model is not valid for this pin.`)
  return {
    model,
    component,
    pin,
    modelName,
    modelType: info.modelTypes.get(modelName)!,
  }
}
