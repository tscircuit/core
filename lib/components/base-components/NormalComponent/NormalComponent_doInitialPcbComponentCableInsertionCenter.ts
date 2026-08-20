import { guessCableInsertCenter } from "@tscircuit/infer-cable-insertion-point"
import type { NormalComponent } from "./NormalComponent"

const shouldInferCableInsertionCenter = (component: NormalComponent) =>
  component.componentName === "Connector" ||
  component.componentName === "Jumper" ||
  component.name.toUpperCase().startsWith("J")

export const NormalComponent_doInitialPcbComponentCableInsertionCenter = (
  component: NormalComponent,
) => {
  if (!shouldInferCableInsertionCenter(component)) return
  if (component.root?.pcbDisabled) return
  if (!component.pcb_component_id || !component.source_component_id) return

  const { db } = component.root!
  const componentCircuitJson = db.toArray().filter((circuitElement) => {
    if (circuitElement.type === "pcb_component") {
      return circuitElement.pcb_component_id === component.pcb_component_id
    }
    if (circuitElement.type === "source_component") {
      return (
        circuitElement.source_component_id === component.source_component_id
      )
    }
    if (
      "pcb_component_id" in circuitElement &&
      circuitElement.pcb_component_id === component.pcb_component_id
    ) {
      return true
    }
    if (
      "source_component_id" in circuitElement &&
      circuitElement.source_component_id === component.source_component_id
    ) {
      return true
    }
    return false
  })

  if (componentCircuitJson.length === 0) return

  const inferredInsertionCenter = guessCableInsertCenter(componentCircuitJson)

  db.pcb_component.update(component.pcb_component_id, {
    cable_insertion_center: {
      x: inferredInsertionCenter.x,
      y: inferredInsertionCenter.y,
    },
  })
}
