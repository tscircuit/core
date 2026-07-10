import type { AnyCircuitElement } from "circuit-json"

const isSymbolElementType = (
  elementType: AnyCircuitElement["type"],
): elementType is
  | "schematic_symbol"
  | "schematic_component"
  | "schematic_line"
  | "schematic_rect"
  | "schematic_circle"
  | "schematic_arc"
  | "schematic_text"
  | "schematic_path" =>
  elementType === "schematic_symbol" ||
  elementType === "schematic_component" ||
  elementType === "schematic_line" ||
  elementType === "schematic_rect" ||
  elementType === "schematic_circle" ||
  elementType === "schematic_arc" ||
  elementType === "schematic_text" ||
  elementType === "schematic_path"

export const isCircuitJsonSymbol = (
  circuitJson: readonly AnyCircuitElement[] | null | undefined,
): circuitJson is readonly AnyCircuitElement[] => {
  return (
    Array.isArray(circuitJson) &&
    circuitJson.length > 0 &&
    circuitJson.some((element) => isSymbolElementType(element.type))
  )
}
