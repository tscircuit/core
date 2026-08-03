import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { InputComponent, PackInput } from "calculate-packing"

const normalizeLayer = (layer: string | undefined) =>
  (layer ?? "top").toLowerCase()

const getComponentLayer = (
  component: InputComponent,
  db: CircuitJsonUtilObjects,
): string | undefined => {
  const layers = new Set<string>()
  const directPcbComponent = db.pcb_component.get(component.componentId)

  if (directPcbComponent) {
    layers.add(normalizeLayer(directPcbComponent.layer))
  }

  for (const pad of component.pads) {
    const via = db.pcb_via.get(pad.padId) as
      | { pcb_component_id?: string }
      | undefined
    const pcbComponentId =
      db.pcb_smtpad.get(pad.padId)?.pcb_component_id ??
      db.pcb_plated_hole.get(pad.padId)?.pcb_component_id ??
      via?.pcb_component_id
    if (!pcbComponentId) continue

    const pcbComponent = db.pcb_component.get(pcbComponentId)
    if (pcbComponent) layers.add(normalizeLayer(pcbComponent.layer))
  }

  return layers.size === 1 ? layers.values().next().value : undefined
}

/**
 * calculate-packing has no layer field, so components on opposite PCB sides
 * otherwise share a collision space. Only split when every packed component can
 * be assigned to exactly one layer; mixed-layer relative groups retain the
 * previous single-job behavior.
 */
export const getPackInputsByPcbLayer = (
  packInput: PackInput,
  db: CircuitJsonUtilObjects,
): PackInput[] => {
  const componentsByLayer = new Map<string, InputComponent[]>()

  for (const component of packInput.components) {
    const layer = getComponentLayer(component, db)
    if (!layer) return [packInput]

    const components = componentsByLayer.get(layer) ?? []
    components.push(component)
    componentsByLayer.set(layer, components)
  }

  if (componentsByLayer.size <= 1) return [packInput]

  const layerPriority = (layer: string) => {
    if (layer === "top") return 0
    if (layer === "bottom") return 1
    return 2
  }

  return Array.from(componentsByLayer.entries())
    .sort(([layerA], [layerB]) => {
      const priorityDifference = layerPriority(layerA) - layerPriority(layerB)
      return priorityDifference || layerA.localeCompare(layerB)
    })
    .map(([, components]) => ({
      ...packInput,
      components,
    }))
}
