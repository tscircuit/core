import type { AnyCircuitElement } from "circuit-json"

export interface CircuitJsonRenderDomains {
  pcb: boolean
  schematic: boolean
}

export const getCircuitJsonRenderDomains = (
  circuitJson: AnyCircuitElement[],
): CircuitJsonRenderDomains => {
  const renderableCircuitJson = circuitJson.filter(
    (element) => !("error_type" in element || "warning_type" in element),
  )

  return {
    pcb: renderableCircuitJson.some((element) =>
      element.type.startsWith("pcb_"),
    ),
    schematic: renderableCircuitJson.some((element) =>
      element.type.startsWith("schematic_"),
    ),
  }
}
