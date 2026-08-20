import { guessCableInsertCenter } from "@tscircuit/infer-cable-insertion-point"
import type { AnyCircuitElement } from "circuit-json"

export const inferCableInsertionCenterForComponent = ({
  circuitJson,
  pcbComponentId,
  sourceComponentId,
}: {
  circuitJson: AnyCircuitElement[]
  pcbComponentId: string
  sourceComponentId: string
}): { x: number; y: number } | null => {
  const componentCircuitJson = circuitJson.filter((circuitElement) => {
    if (circuitElement.type === "pcb_component") {
      return circuitElement.pcb_component_id === pcbComponentId
    }
    if (circuitElement.type === "source_component") {
      return circuitElement.source_component_id === sourceComponentId
    }
    if (
      "pcb_component_id" in circuitElement &&
      circuitElement.pcb_component_id === pcbComponentId
    ) {
      return true
    }
    if (
      "source_component_id" in circuitElement &&
      circuitElement.source_component_id === sourceComponentId
    ) {
      return true
    }
    return false
  })

  if (componentCircuitJson.length === 0) return null

  const inferredCenter = guessCableInsertCenter(componentCircuitJson)
  return { x: inferredCenter.x, y: inferredCenter.y }
}
